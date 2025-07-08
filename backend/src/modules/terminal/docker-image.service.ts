import { Injectable, Logger } from "@nestjs/common";
import Docker from "dockerode";
import * as path from "path";
import * as fs from "fs";

export interface LanguageConfig {
  name: string;
  dockerfilePath: string;
  imageName: string;
  runCommand: string;
  compileCommand?: string;
  fileExtension: string;
}

@Injectable()
export class DockerImageService {
  private readonly logger = new Logger(DockerImageService.name);
  private docker: Docker;

  // 언어별 설정
  private readonly languageConfigs: Record<string, LanguageConfig> = {
    python: {
      name: "python",
      dockerfilePath: "dockerfiles/python.Dockerfile",
      imageName: "vibe-coding-python",
      runCommand: "python3 {filename}",
      fileExtension: ".py"
    },
    nodejs: {
      name: "nodejs",
      dockerfilePath: "dockerfiles/nodejs.Dockerfile",
      imageName: "vibe-coding-nodejs",
      runCommand: "node {filename}",
      fileExtension: ".js"
    },
    typescript: {
      name: "typescript",
      dockerfilePath: "dockerfiles/nodejs.Dockerfile",
      imageName: "vibe-coding-nodejs",
      runCommand: "ts-node {filename}",
      fileExtension: ".ts"
    },
    java: {
      name: "java",
      dockerfilePath: "dockerfiles/java.Dockerfile",
      imageName: "vibe-coding-java",
      compileCommand: "javac {filename}",
      runCommand: "java {classname}",
      fileExtension: ".java"
    },
    cpp: {
      name: "cpp",
      dockerfilePath: "dockerfiles/cpp.Dockerfile",
      imageName: "vibe-coding-cpp",
      compileCommand: "g++ -o {output} {filename}",
      runCommand: "./{output}",
      fileExtension: ".cpp"
    },
    c: {
      name: "c",
      dockerfilePath: "dockerfiles/cpp.Dockerfile",
      imageName: "vibe-coding-cpp",
      compileCommand: "gcc -o {output} {filename}",
      runCommand: "./{output}",
      fileExtension: ".c"
    },
    go: {
      name: "go",
      dockerfilePath: "dockerfiles/go.Dockerfile",
      imageName: "vibe-coding-go",
      runCommand: "go run {filename}",
      fileExtension: ".go"
    },
    rust: {
      name: "rust",
      dockerfilePath: "dockerfiles/rust.Dockerfile",
      imageName: "vibe-coding-rust",
      compileCommand: "rustc {filename} -o {output}",
      runCommand: "./{output}",
      fileExtension: ".rs"
    }
  };

  constructor() {
    this.docker = new Docker({
      socketPath: "/var/run/docker.sock",
    });
  }

  /**
   * 지원하는 언어 목록 반환
   */
  getSupportedLanguages(): string[] {
    return Object.keys(this.languageConfigs);
  }

  /**
   * 언어 설정 조회
   */
  getLanguageConfig(language: string): LanguageConfig | null {
    return this.languageConfigs[language] || null;
  }

  /**
   * 언어별 Docker 이미지 빌드
   */
  async buildLanguageImage(language: string): Promise<void> {
    const config = this.getLanguageConfig(language);
    if (!config) {
      throw new Error(`지원하지 않는 언어입니다: ${language}`);
    }

    const dockerfilePath = path.join(process.cwd(), config.dockerfilePath);
    
    if (!fs.existsSync(dockerfilePath)) {
      throw new Error(`Dockerfile을 찾을 수 없습니다: ${dockerfilePath}`);
    }

    try {
      this.logger.log(`Building Docker image for ${language}...`);

      // Dockerfile 내용 읽기
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');

      // 이미지 빌드
      const stream = await this.docker.buildImage(
        {
          context: process.cwd(),
          src: [config.dockerfilePath]
        },
        {
          t: config.imageName,
          dockerfile: config.dockerfilePath
        }
      );

      // 빌드 진행상황 모니터링
      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) => {
          if (err) {
            this.logger.error(`Failed to build image for ${language}: ${err.message}`);
            reject(err);
          } else {
            this.logger.log(`Successfully built image for ${language}`);
            resolve(res);
          }
        }, (event) => {
          if (event.stream) {
            this.logger.debug(`Build ${language}: ${event.stream.trim()}`);
          }
        });
      });

    } catch (error) {
      this.logger.error(`Failed to build image for ${language}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 모든 언어의 Docker 이미지 빌드
   */
  async buildAllImages(): Promise<void> {
    const languages = this.getSupportedLanguages();
    
    for (const language of languages) {
      try {
        await this.buildLanguageImage(language);
      } catch (error) {
        this.logger.error(`Failed to build image for ${language}: ${error.message}`);
        // 다른 언어 이미지 빌드를 계속 진행
      }
    }
  }

  /**
   * 이미지 존재 여부 확인
   */
  async imageExists(imageName: string): Promise<boolean> {
    try {
      await this.docker.getImage(imageName).inspect();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 언어별 이미지 자동 빌드 (없으면 빌드)
   */
  async ensureLanguageImage(language: string): Promise<void> {
    const config = this.getLanguageConfig(language);
    if (!config) {
      throw new Error(`지원하지 않는 언어입니다: ${language}`);
    }

    const exists = await this.imageExists(config.imageName);
    if (!exists) {
      this.logger.log(`Image ${config.imageName} does not exist, building...`);
      await this.buildLanguageImage(language);
    }
  }

  /**
   * 코드 실행 명령어 생성
   */
  generateRunCommand(language: string, filename: string): { compileCommand?: string; runCommand: string } {
    const config = this.getLanguageConfig(language);
    if (!config) {
      throw new Error(`지원하지 않는 언어입니다: ${language}`);
    }

    const baseFilename = path.basename(filename, config.fileExtension);
    const result: { compileCommand?: string; runCommand: string } = {
      runCommand: config.runCommand.replace('{filename}', filename)
    };

    if (config.compileCommand) {
      result.compileCommand = config.compileCommand
        .replace('{filename}', filename)
        .replace('{output}', baseFilename)
        .replace('{classname}', baseFilename);
    }

    result.runCommand = result.runCommand
      .replace('{output}', baseFilename)
      .replace('{classname}', baseFilename);

    return result;
  }

  /**
   * 이미지 정리
   */
  async cleanupImages(): Promise<void> {
    const languages = this.getSupportedLanguages();
    
    for (const language of languages) {
      const config = this.getLanguageConfig(language);
      if (config) {
        try {
          const image = this.docker.getImage(config.imageName);
          await image.remove();
          this.logger.log(`Removed image: ${config.imageName}`);
        } catch (error) {
          this.logger.warn(`Failed to remove image ${config.imageName}: ${error.message}`);
        }
      }
    }
  }

  /**
   * 시스템 정보 조회
   */
  async getSystemInfo(): Promise<any> {
    try {
      const info = await this.docker.info();
      const images = await this.docker.listImages();
      
      const languageImages = images.filter(img => 
        img.RepoTags?.some(tag => tag.startsWith('vibe-coding-'))
      );

      return {
        docker: {
          containers: info.Containers,
          images: info.Images,
          memory: info.MemoryLimit,
          cpu: info.NCPU,
        },
        languageImages: languageImages.map(img => ({
          id: img.Id,
          tags: img.RepoTags,
          size: img.Size,
          created: img.Created
        }))
      };
    } catch (error) {
      this.logger.error(`Failed to get system info: ${error.message}`);
      return null;
    }
  }
}