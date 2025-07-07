import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { JudgeRequestDto } from './dto/judge-request.dto';
import { JudgeResultDto, JudgeStatus } from './dto/judge-result.dto';

const execAsync = promisify(exec);

@Injectable()
export class DockerJudgeService {
  private readonly logger = new Logger(DockerJudgeService.name);
  private readonly tempDir = path.join(process.cwd(), 'temp');

  constructor() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async judgeWithDocker(request: JudgeRequestDto): Promise<JudgeResultDto> {
    const { code, language, testcases, timeLimit, memoryLimit } = request;
    const submissionId = request.submissionId;
    
    // 고유한 작업 디렉토리 생성
    const workDir = path.join(this.tempDir, crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(workDir, { recursive: true });
    
    try {
      // 코드 파일 생성
      const fileName = this.getFileName(language);
      const filePath = path.join(workDir, fileName);
      fs.writeFileSync(filePath, code);

      // Dockerfile 생성
      const dockerfilePath = path.join(workDir, 'Dockerfile');
      this.createDockerfile(dockerfilePath, language, fileName);

      // Docker 이미지 빌드
      const imageName = `judge-${submissionId}`;
      await this.buildDockerImage(workDir, imageName);

      const testcaseResults = [];
      let totalExecutionTime = 0;
      let maxMemoryUsed = 0;
      let passedTestcases = 0;

      // 각 테스트케이스 실행
      for (let i = 0; i < testcases.length; i++) {
        const testcase = testcases[i];
        const result = await this.runTestCaseInDocker(
          imageName,
          testcase.input,
          testcase.output,
          timeLimit,
          memoryLimit,
          i,
        );

        testcaseResults.push(result);
        totalExecutionTime += result.executionTime;
        maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed);

        if (result.isCorrect) {
          passedTestcases++;
        } else {
          break; // 첫 번째 오답에서 중단
        }
      }

      // 최종 상태 결정
      const status = this.determineFinalStatus(testcaseResults, passedTestcases, testcases.length);

      return {
        submissionId,
        status,
        totalTestcases: testcases.length,
        passedTestcases,
        testcaseResults,
        totalExecutionTime,
        maxMemoryUsed,
      };
    } finally {
      // 정리
      await this.cleanupDocker(imageName);
      this.cleanupWorkDir(workDir);
    }
  }

  private createDockerfile(dockerfilePath: string, language: string, fileName: string): void {
    let dockerfileContent = '';

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        dockerfileContent = `
FROM node:18-alpine
WORKDIR /app
COPY ${fileName} .
CMD ["node", "${fileName}"]
`;
        break;
      case 'python':
      case 'py':
        dockerfileContent = `
FROM python:3.9-alpine
WORKDIR /app
COPY ${fileName} .
CMD ["python", "${fileName}"]
`;
        break;
      case 'java':
        dockerfileContent = `
FROM openjdk:11-jre-alpine
WORKDIR /app
COPY ${fileName} .
RUN javac ${fileName}
CMD ["java", "${fileName.replace('.java', '')}"]
`;
        break;
      case 'cpp':
      case 'c++':
        dockerfileContent = `
FROM gcc:latest
WORKDIR /app
COPY ${fileName} .
RUN g++ -o program ${fileName}
CMD ["./program"]
`;
        break;
      case 'c':
        dockerfileContent = `
FROM gcc:latest
WORKDIR /app
COPY ${fileName} .
RUN gcc -o program ${fileName}
CMD ["./program"]
`;
        break;
      default:
        throw new Error(`지원하지 않는 언어입니다: ${language}`);
    }

    fs.writeFileSync(dockerfilePath, dockerfileContent);
  }

  private getFileName(language: string): string {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'solution.js';
      case 'python':
      case 'py':
        return 'solution.py';
      case 'java':
        return 'Solution.java';
      case 'cpp':
      case 'c++':
        return 'solution.cpp';
      case 'c':
        return 'solution.c';
      default:
        return 'solution.txt';
    }
  }

  private async buildDockerImage(workDir: string, imageName: string): Promise<void> {
    try {
      await execAsync(`docker build -t ${imageName} .`, { cwd: workDir });
    } catch (error) {
      throw new Error(`Docker 이미지 빌드 실패: ${error.message}`);
    }
  }

  private async runTestCaseInDocker(
    imageName: string,
    input: string,
    expectedOutput: string,
    timeLimit: number,
    memoryLimit: number,
    testcaseId: number,
  ) {
    const startTime = Date.now();
    
    try {
      // Docker 컨테이너 실행
      const { stdout, stderr } = await execAsync(
        `docker run --rm --memory=${memoryLimit}m --cpus=1 ${imageName}`,
        {
          input: input,
          timeout: timeLimit,
          maxBuffer: 1024 * 1024, // 1MB
        }
      );

      const executionTime = Date.now() - startTime;
      const actualOutput = stdout.trim();
      const isCorrect = this.compareOutput(actualOutput, expectedOutput);

      return {
        testcaseId,
        input,
        expectedOutput,
        actualOutput,
        isCorrect,
        executionTime,
        memoryUsed: 0, // Docker에서 메모리 사용량 측정은 복잡함
        errorMessage: stderr || undefined,
      };
    } catch (error) {
      return {
        testcaseId,
        input,
        expectedOutput,
        actualOutput: '',
        isCorrect: false,
        executionTime: 0,
        memoryUsed: 0,
        errorMessage: error.message,
      };
    }
  }

  private compareOutput(actual: string, expected: string): boolean {
    const normalize = (str: string) => str.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return normalize(actual) === normalize(expected);
  }

  private determineFinalStatus(
    testcaseResults: any[],
    passedTestcases: number,
    totalTestcases: number,
  ): JudgeStatus {
    if (passedTestcases === totalTestcases) {
      return JudgeStatus.ACCEPTED;
    }

    const firstFailure = testcaseResults.find(result => !result.isCorrect);
    if (firstFailure?.errorMessage) {
      if (firstFailure.errorMessage.includes('timeout')) {
        return JudgeStatus.TIME_LIMIT_EXCEEDED;
      }
      if (firstFailure.errorMessage.includes('memory')) {
        return JudgeStatus.MEMORY_LIMIT_EXCEEDED;
      }
      return JudgeStatus.RUNTIME_ERROR;
    }

    return JudgeStatus.WRONG_ANSWER;
  }

  private async cleanupDocker(imageName: string): Promise<void> {
    try {
      await execAsync(`docker rmi ${imageName}`);
    } catch (error) {
      this.logger.warn(`Docker 이미지 정리 실패: ${imageName}`, error);
    }
  }

  private cleanupWorkDir(workDir: string): void {
    try {
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.logger.warn(`작업 디렉토리 정리 실패: ${workDir}`, error);
    }
  }
} 