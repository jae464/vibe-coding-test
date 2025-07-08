import { Injectable, Logger } from "@nestjs/common";
import Docker from "dockerode";
import { v4 as uuidv4 } from "uuid";

export interface TerminalSession {
  id: string;
  userId: string;
  containerId: string;
  language: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface TerminalCommand {
  sessionId: string;
  command: string;
  output: string;
  error?: string;
  exitCode: number;
}

@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name);
  private docker: Docker;
  private activeSessions = new Map<string, TerminalSession>();

  constructor() {
    this.docker = new Docker({
      socketPath: "/var/run/docker.sock", // Linux
      // Windows의 경우: host: 'localhost', port: 2375
    });
  }

  /**
   * 사용자별 터미널 세션 생성
   */
  async createSession(
    userId: string,
    language: string = "bash"
  ): Promise<TerminalSession> {
    try {
      const sessionId = uuidv4();
      const containerName = `terminal-${sessionId}`;

      // 기본 ubuntu 이미지 사용 (모든 언어 지원)
      const image = "ubuntu:latest";

      await new Promise<void>((resolve, reject) => {
        this.docker.pull(image, (err, stream) => {
          if (err) return reject(err);
          this.docker.modem.followProgress(stream, (pullErr) =>
            pullErr ? reject(pullErr) : resolve()
          );
        });
      });

      // 컨테이너 생성
      const container = await this.docker.createContainer({
        Image: image,
        name: containerName,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        OpenStdin: true,
        StdinOnce: false,
        Cmd: ["/bin/bash"],
        WorkingDir: "/workspace",
        HostConfig: {
          Memory: 512 * 1024 * 1024, // 512MB 메모리 제한
          MemorySwap: 0,
          CpuPeriod: 100000,
          CpuQuota: 50000, // CPU 제한 (50%)
          SecurityOpt: ["no-new-privileges"],
          ReadonlyRootfs: false,
          Binds: [`/tmp/terminal-${sessionId}:/workspace`],
        },
        Env: ["TERM=xterm-256color", "LANG=C.UTF-8", "LC_ALL=C.UTF-8"],
      });

      await container.start();

      // 기본 도구 설치 (apt-get update만 먼저 실행)
      try {
        const exec = await container.exec({
          AttachStdout: true,
          AttachStderr: true,
          Cmd: ["/bin/bash", "-c", "apt-get update -y"],
        });

        const stream = await exec.start({ hijack: true, Tty: false });

        await new Promise<void>((resolve, reject) => {
          let output = "";

          stream.on("error", (err) => {
            // this.logger.error(`apt-get update stream error: ${err.message}`);
            console.log(`apt-get update stream error: ${err.message}`);
            reject(err);
          });

          stream.on("end", async () => {
            const inspectData = await exec.inspect();
            this.logger.log(
              `apt-get update finished (exit code ${inspectData.ExitCode})`
            );
            resolve();
          });

          // multiplexed 분리
          container.modem.demuxStream(
            stream,
            { write: (chunk) => (output += chunk.toString()) },
            { write: (chunk) => (output += chunk.toString()) }
          );
        });

        // await new Promise<void>((resolve, reject) => {
        //   exec.start({}, (err, stream) => {
        //     if (err) {
        //       this.logger.error(
        //         `Failed to update package list: ${err.message}`
        //       );
        //       resolve(); // 에러가 있어도 계속 진행
        //       return;
        //     }

        //     stream.on("end", () => {
        //       this.logger.log("Package list updated successfully");
        //       resolve();
        //     });

        //     stream.on("error", (err) => {
        //       this.logger.error(
        //         `Failed to update package list: ${err.message}`
        //       );
        //       resolve(); // 에러가 있어도 계속 진행
        //     });
        //   });
        // });
      } catch (error) {
        this.logger.error(`Failed to update package list: ${error.message}`);
      }

      const session: TerminalSession = {
        id: sessionId,
        userId,
        containerId: container.id,
        language,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.activeSessions.set(sessionId, session);
      this.logger.log(
        `Terminal session created: ${sessionId} for user: ${userId}`
      );

      return session;
    } catch (error) {
      this.logger.error(`Failed to create terminal session: ${error.message}`);
      throw new Error("터미널 세션 생성에 실패했습니다.");
    }
  }

  /**
   * 터미널에서 명령어 실행
   */
  async executeCommand(
    sessionId: string,
    command: string
  ): Promise<TerminalCommand> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error("세션을 찾을 수 없습니다.");
      }

      // 세션 활동 시간 업데이트
      session.lastActivity = new Date();

      const container = this.docker.getContainer(session.containerId);

      // 컨테이너 상태 확인
      const containerInfo = await container.inspect();
      if (!containerInfo.State.Running) {
        throw new Error("컨테이너가 실행되지 않고 있습니다.");
      }

      const exec = await container.exec({
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ["/bin/bash", "-c", command],
      });

      console.log("exec created for command:", exec.id);

      return new Promise((resolve, reject) => {
        exec.start({ hijack: true, Tty: false }, (err, stream) => {
          console.log("exec.start callback called for command");
          if (err) {
            console.error("exec.start error:", err);
            reject(err);
            return;
          }

          if (!stream) {
            console.error("stream is null for command");
            reject(new Error("스트림을 생성할 수 없습니다."));
            return;
          }

          let output = "";
          let error = "";

          // multiplexed 스트림 분리
          container.modem.demuxStream(
            stream,
            { write: (chunk) => (output += chunk.toString()) },
            { write: (chunk) => (error += chunk.toString()) }
          );

          stream.on("end", async () => {
            console.log("command stream ended");
            try {
              const inspect = await exec.inspect();
              console.log("command exec inspect:", inspect);

              const result: TerminalCommand = {
                sessionId,
                command,
                output,
                error: error || undefined,
                exitCode: inspect.ExitCode || 0,
              };

              resolve(result);
            } catch (inspectErr) {
              console.error("exec.inspect error for command:", inspectErr);
              reject(inspectErr);
            }
          });

          stream.on("error", (streamErr) => {
            console.error("command stream error:", streamErr);
            reject(streamErr);
          });

          // 타임아웃 설정 (30초)
          setTimeout(() => {
            console.error("command exec.start timeout");
            reject(new Error("명령어 실행이 타임아웃되었습니다."));
          }, 30000);
        });
      });
    } catch (error) {
      this.logger.error(`Failed to execute command: ${error.message}`);
      throw new Error(`명령어 실행에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 파일 생성/수정
   */
  async createFile(
    sessionId: string,
    filename: string,
    content: string
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      console.log("session", session);
      if (!session) {
        throw new Error("세션을 찾을 수 없습니다.");
      }

      const container = this.docker.getContainer(session.containerId);

      // 컨테이너 상태 확인
      const containerInfo = await container.inspect();
      if (!containerInfo.State.Running) {
        throw new Error("컨테이너가 실행되지 않고 있습니다.");
      }

      // 파일 내용을 base64로 인코딩하여 특수문자 문제 해결
      const encodedContent = Buffer.from(content).toString("base64");
      const command = `echo '${encodedContent}' | base64 -d > /workspace/${filename}`;

      const exec = await container.exec({
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ["/bin/bash", "-c", command],
      });

      console.log("exec created:", exec.id);

      return new Promise((resolve, reject) => {
        exec.start({ hijack: true, Tty: false }, (err, stream) => {
          console.log("exec.start callback called");
          if (err) {
            console.error("exec.start error:", err);
            reject(err);
            return;
          }

          if (!stream) {
            console.error("stream is null");
            reject(new Error("스트림을 생성할 수 없습니다."));
            return;
          }

          let output = "";
          let error = "";

          // multiplexed 스트림 분리
          container.modem.demuxStream(
            stream,
            { write: (chunk) => (output += chunk.toString()) },
            { write: (chunk) => (error += chunk.toString()) }
          );

          stream.on("end", async () => {
            console.log("stream ended");
            try {
              const inspectData = await exec.inspect();
              console.log("exec inspect:", inspectData);

              if (inspectData.ExitCode !== 0) {
                console.error(
                  "Command failed with exit code:",
                  inspectData.ExitCode
                );
                console.error("Error output:", error);
                reject(
                  new Error(
                    `파일 생성 명령이 실패했습니다. Exit code: ${inspectData.ExitCode}`
                  )
                );
                return;
              }

              this.logger.log(
                `File created: ${filename} in session: ${sessionId}`
              );
              resolve();
            } catch (inspectErr) {
              console.error("exec.inspect error:", inspectErr);
              reject(inspectErr);
            }
          });

          stream.on("error", (streamErr) => {
            console.error("stream error:", streamErr);
            reject(streamErr);
          });

          // 타임아웃 설정 (10초)
          setTimeout(() => {
            console.error("exec.start timeout");
            reject(new Error("파일 생성이 타임아웃되었습니다."));
          }, 10000);
        });
      });
    } catch (error) {
      this.logger.error(`Failed to create file: ${error.message}`);
      throw new Error(`파일 생성에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 파일 읽기
   */
  async readFile(sessionId: string, filename: string): Promise<string> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error("세션을 찾을 수 없습니다.");
      }

      const container = this.docker.getContainer(session.containerId);

      // 컨테이너 상태 확인
      const containerInfo = await container.inspect();
      if (!containerInfo.State.Running) {
        throw new Error("컨테이너가 실행되지 않고 있습니다.");
      }

      const exec = await container.exec({
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ["cat", `/workspace/${filename}`],
      });

      let content = "";

      return new Promise((resolve, reject) => {
        exec.start({ hijack: true, Tty: false }, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          if (!stream) {
            reject(new Error("스트림을 생성할 수 없습니다."));
            return;
          }

          // multiplexed 스트림 분리
          container.modem.demuxStream(
            stream,
            { write: (chunk) => (content += chunk.toString()) },
            { write: (chunk) => {} } // stderr는 무시
          );

          stream.on("end", () => {
            resolve(content);
          });

          stream.on("error", (err) => {
            reject(err);
          });
        });
      });
    } catch (error) {
      this.logger.error(`Failed to read file: ${error.message}`);
      throw new Error(`파일 읽기에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 세션 목록 조회
   */
  async getSessionsByUser(userId: string): Promise<TerminalSession[]> {
    return Array.from(this.activeSessions.values()).filter(
      (session) => session.userId === userId
    );
  }

  /**
   * 세션 정보 조회
   */
  async getSession(sessionId: string): Promise<TerminalSession | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * 세션 종료
   */
  async destroySession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return;
      }

      const container = this.docker.getContainer(session.containerId);
      await container.stop();
      await container.remove();

      this.activeSessions.delete(sessionId);
      this.logger.log(`Terminal session destroyed: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to destroy session: ${error.message}`);
    }
  }

  /**
   * 사용자의 모든 세션 종료
   */
  async destroyUserSessions(userId: string): Promise<void> {
    const userSessions = await this.getSessionsByUser(userId);
    await Promise.all(
      userSessions.map((session) => this.destroySession(session.id))
    );
  }

  /**
   * 비활성 세션 정리 (30분 이상 비활성)
   */
  async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30분

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const inactiveTime = now.getTime() - session.lastActivity.getTime();
      if (inactiveTime > inactiveThreshold) {
        await this.destroySession(sessionId);
      }
    }
  }

  /**
   * 시스템 정보 조회
   */
  async getSystemInfo(): Promise<any> {
    try {
      const info = await this.docker.info();
      return {
        containers: info.Containers,
        images: info.Images,
        memory: info.MemoryLimit,
        cpu: info.NCPU,
      };
    } catch (error) {
      this.logger.error(`Failed to get system info: ${error.message}`);
      return null;
    }
  }
}
