import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../../entities/Submission';
import { Problem } from '../../entities/Problem';
import { Testcase } from '../../entities/Testcase';
import { JudgeRequestDto } from './dto/judge-request.dto';
import { JudgeResultDto, JudgeStatus } from './dto/judge-result.dto';
import { RoomsService } from '../rooms/rooms.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);
  private readonly tempDir = path.join(process.cwd(), 'temp');

  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    @InjectRepository(Problem)
    private problemsRepository: Repository<Problem>,
    @InjectRepository(Testcase)
    private testcasesRepository: Repository<Testcase>,
    private roomsService: RoomsService,
  ) {
    // 임시 디렉토리 생성
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async judgeSubmission(submissionId: number): Promise<JudgeResultDto> {
    try {
      // 제출 정보 조회
      const submission = await this.submissionsRepository.findOne({
        where: { id: submissionId },
        relations: ['problem', 'room'],
      });

      if (!submission) {
        throw new Error('제출을 찾을 수 없습니다.');
      }

      // 문제 정보 조회
      const problem = await this.problemsRepository.findOne({
        where: { id: submission.problemId },
        relations: ['testcases'],
      });

      if (!problem) {
        throw new Error('문제를 찾을 수 없습니다.');
      }

      // 테스트케이스 조회
      const testcases = await this.testcasesRepository.find({
        where: { problemId: problem.id },
      });

      // 채점 요청 생성
      const judgeRequest: JudgeRequestDto = {
        code: submission.code,
        language: submission.language,
        problemId: problem.id,
        submissionId: submission.id,
        testcases: testcases.map(tc => ({
          input: tc.input,
          output: tc.output,
          isSample: tc.isSample,
        })),
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
      };

      // 채점 실행
      const result = await this.executeJudge(judgeRequest);

      // 결과 저장
      await this.saveJudgeResult(submission, result);

      // WebSocket을 통해 결과 브로드캐스트
      if (submission.roomId) {
        await this.roomsService.broadcastSubmissionResult(
          submission.roomId,
          submission.id,
          problem.id,
          result.status,
          this.formatResultMessage(result),
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`채점 중 오류 발생: ${error.message}`, error.stack);
      
      const errorResult: JudgeResultDto = {
        submissionId,
        status: JudgeStatus.SYSTEM_ERROR,
        totalTestcases: 0,
        passedTestcases: 0,
        testcaseResults: [],
        totalExecutionTime: 0,
        maxMemoryUsed: 0,
        systemError: error.message,
      };

      return errorResult;
    }
  }

  private async executeJudge(request: JudgeRequestDto): Promise<JudgeResultDto> {
    const { code, language, testcases, timeLimit, memoryLimit } = request;
    
    // 임시 파일 생성
    const fileId = crypto.randomBytes(8).toString('hex');
    const filePath = path.join(this.tempDir, `${fileId}.${this.getFileExtension(language)}`);
    
    try {
      // 코드 파일 생성
      fs.writeFileSync(filePath, code);

      const testcaseResults = [];
      let totalExecutionTime = 0;
      let maxMemoryUsed = 0;
      let passedTestcases = 0;

      // 각 테스트케이스 실행
      for (let i = 0; i < testcases.length; i++) {
        const testcase = testcases[i];
        const result = await this.executeTestCase(
          filePath,
          language,
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
          // 첫 번째 오답에서 중단 (선택사항)
          break;
        }
      }

      // 최종 상태 결정
      const status = this.determineFinalStatus(testcaseResults, passedTestcases, testcases.length);

      return {
        submissionId: request.submissionId,
        status,
        totalTestcases: testcases.length,
        passedTestcases,
        testcaseResults,
        totalExecutionTime,
        maxMemoryUsed,
      };
    } finally {
      // 임시 파일 정리
      this.cleanupTempFile(filePath);
    }
  }

  private async executeTestCase(
    filePath: string,
    language: string,
    input: string,
    expectedOutput: string,
    timeLimit: number,
    memoryLimit: number,
    testcaseId: number,
  ) {
    try {
      const startTime = Date.now();
      
      // 언어별 실행 명령어 생성
      const command = this.buildExecutionCommand(filePath, language);
      
      // 실행
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeLimit,
        input: input,
        maxBuffer: 1024 * 1024, // 1MB
      });

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
        memoryUsed: 0, // TODO: 메모리 사용량 측정 구현
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

  private buildExecutionCommand(filePath: string, language: string): string {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return `node ${filePath}`;
      case 'python':
      case 'py':
        return `python3 ${filePath}`;
      case 'java':
        return `java ${filePath}`;
      case 'cpp':
      case 'c++':
        return `g++ ${filePath} -o ${filePath}.out && ${filePath}.out`;
      case 'c':
        return `gcc ${filePath} -o ${filePath}.out && ${filePath}.out`;
      default:
        throw new Error(`지원하지 않는 언어입니다: ${language}`);
    }
  }

  private getFileExtension(language: string): string {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'js';
      case 'python':
      case 'py':
        return 'py';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      default:
        return 'txt';
    }
  }

  private compareOutput(actual: string, expected: string): boolean {
    // 공백과 줄바꿈 정규화 후 비교
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

    // 첫 번째 실패한 테스트케이스의 에러 타입 확인
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

  private async saveJudgeResult(submission: Submission, result: JudgeResultDto): Promise<void> {
    const status = this.mapJudgeStatusToSubmissionStatus(result.status);
    
    await this.submissionsRepository.update(submission.id, {
      status,
      resultMessage: this.formatResultMessage(result),
      score: result.passedTestcases,
      executionTime: result.totalExecutionTime,
      memoryUsed: result.maxMemoryUsed,
    });
  }

  private mapJudgeStatusToSubmissionStatus(judgeStatus: JudgeStatus): SubmissionStatus {
    switch (judgeStatus) {
      case JudgeStatus.ACCEPTED:
        return SubmissionStatus.ACCEPTED;
      case JudgeStatus.WRONG_ANSWER:
        return SubmissionStatus.WRONG_ANSWER;
      case JudgeStatus.RUNTIME_ERROR:
        return SubmissionStatus.RUNTIME_ERROR;
      case JudgeStatus.TIME_LIMIT_EXCEEDED:
        return SubmissionStatus.TIME_LIMIT_EXCEEDED;
      case JudgeStatus.MEMORY_LIMIT_EXCEEDED:
        return SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
      case JudgeStatus.COMPILATION_ERROR:
        return SubmissionStatus.COMPILATION_ERROR;
      default:
        return SubmissionStatus.RUNTIME_ERROR;
    }
  }

  private formatResultMessage(result: JudgeResultDto): string {
    if (result.status === JudgeStatus.ACCEPTED) {
      return `정답입니다! (${result.passedTestcases}/${result.totalTestcases} 테스트케이스 통과)`;
    }

    if (result.compilationError) {
      return `컴파일 오류: ${result.compilationError}`;
    }

    if (result.systemError) {
      return `시스템 오류: ${result.systemError}`;
    }

    const firstFailure = result.testcaseResults.find(r => !r.isCorrect);
    if (firstFailure) {
      return `오답입니다. (${result.passedTestcases}/${result.totalTestcases} 테스트케이스 통과)\n입력: ${firstFailure.input}\n기대 출력: ${firstFailure.expectedOutput}\n실제 출력: ${firstFailure.actualOutput}`;
    }

    return `채점 중 오류가 발생했습니다.`;
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // 컴파일된 파일도 정리
      const compiledPath = `${filePath}.out`;
      if (fs.existsSync(compiledPath)) {
        fs.unlinkSync(compiledPath);
      }
    } catch (error) {
      this.logger.warn(`임시 파일 정리 실패: ${filePath}`, error);
    }
  }
} 