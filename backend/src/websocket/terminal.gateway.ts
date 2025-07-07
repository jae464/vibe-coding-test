import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { WsJwtGuard } from "../guards/ws-jwt.guard";
import { TerminalService } from "../modules/terminal/terminal.service";

interface TerminalSession {
  sessionId: string;
  userId: string;
  socketId: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: "/terminal",
})
@UseGuards(WsJwtGuard)
export class TerminalGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private terminalSessions = new Map<string, TerminalSession>();

  constructor(private terminalService: TerminalService) {}

  handleConnection(client: Socket) {
    console.log(`[Terminal] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Terminal] Client disconnected: ${client.id}`);

    // 연결된 터미널 세션 정리
    for (const [sessionId, session] of this.terminalSessions.entries()) {
      if (session.socketId === client.id) {
        this.terminalSessions.delete(sessionId);
        console.log(`[Terminal] Session ${sessionId} cleaned up`);
      }
    }
  }

  @SubscribeMessage("create_session")
  async handleCreateSession(
    @MessageBody() data: { language?: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const userId = (client as any).user?.id;
      if (!userId) {
        client.emit("error", { message: "인증이 필요합니다." });
        return;
      }

      const session = await this.terminalService.createSession(
        userId,
        data.language || "bash"
      );

      // 세션 정보 저장
      this.terminalSessions.set(session.id, {
        sessionId: session.id,
        userId,
        socketId: client.id,
      });

      // 클라이언트를 세션 룸에 참가시킴
      await client.join(`terminal_${session.id}`);

      client.emit("session_created", {
        sessionId: session.id,
        language: session.language,
        message: "터미널 세션이 생성되었습니다.",
      });

      console.log(
        `[Terminal] Session created: ${session.id} for user: ${userId}`
      );
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("execute_command")
  async handleExecuteCommand(
    @MessageBody() data: { sessionId: string; command: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const session = this.terminalSessions.get(data.sessionId);
      if (!session) {
        client.emit("error", { message: "세션을 찾을 수 없습니다." });
        return;
      }

      // 명령어 실행
      const result = await this.terminalService.executeCommand(
        data.sessionId,
        data.command
      );

      // 결과를 클라이언트에게 전송
      client.emit("command_result", {
        sessionId: data.sessionId,
        command: data.command,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
      });

      console.log(
        `[Terminal] Command executed: ${data.command} in session: ${data.sessionId}`
      );
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("create_file")
  async handleCreateFile(
    @MessageBody()
    data: { sessionId: string; filename: string; content: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const session = this.terminalSessions.get(data.sessionId);
      if (!session) {
        client.emit("error", { message: "세션을 찾을 수 없습니다." });
        return;
      }

      await this.terminalService.createFile(
        data.sessionId,
        data.filename,
        data.content
      );

      client.emit("file_created", {
        sessionId: data.sessionId,
        filename: data.filename,
        message: "파일이 생성되었습니다.",
      });

      console.log(
        `[Terminal] File created: ${data.filename} in session: ${data.sessionId}`
      );
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("read_file")
  async handleReadFile(
    @MessageBody() data: { sessionId: string; filename: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const session = this.terminalSessions.get(data.sessionId);
      if (!session) {
        client.emit("error", { message: "세션을 찾을 수 없습니다." });
        return;
      }

      const content = await this.terminalService.readFile(
        data.sessionId,
        data.filename
      );

      client.emit("file_content", {
        sessionId: data.sessionId,
        filename: data.filename,
        content,
      });

      console.log(
        `[Terminal] File read: ${data.filename} in session: ${data.sessionId}`
      );
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("destroy_session")
  async handleDestroySession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const session = this.terminalSessions.get(data.sessionId);
      if (!session) {
        client.emit("error", { message: "세션을 찾을 수 없습니다." });
        return;
      }

      await this.terminalService.destroySession(data.sessionId);
      this.terminalSessions.delete(data.sessionId);

      // 클라이언트를 세션 룸에서 나가게 함
      await client.leave(`terminal_${data.sessionId}`);

      client.emit("session_destroyed", {
        sessionId: data.sessionId,
        message: "터미널 세션이 종료되었습니다.",
      });

      console.log(`[Terminal] Session destroyed: ${data.sessionId}`);
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("list_sessions")
  async handleListSessions(@ConnectedSocket() client: Socket) {
    try {
      const userId = (client as any).user?.id;
      if (!userId) {
        client.emit("error", { message: "인증이 필요합니다." });
        return;
      }

      const sessions = await this.terminalService.getSessionsByUser(userId);
      client.emit("sessions_list", { sessions });

      console.log(`[Terminal] Sessions listed for user: ${userId}`);
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("system_info")
  async handleSystemInfo(@ConnectedSocket() client: Socket) {
    try {
      const info = await this.terminalService.getSystemInfo();
      client.emit("system_info", { info });

      console.log(`[Terminal] System info requested`);
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }
}
