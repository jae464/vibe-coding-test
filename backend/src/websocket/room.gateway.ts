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
import {
  CodeChangeEvent,
  JoinRoomEvent,
  LeaveRoomEvent,
  ChatMessageEvent,
  SubmissionEvent,
} from "./events/room.events";

@WebSocketGateway({
  cors: {
    // origin: process.env.FRONTEND_URL || "http://localhost:3000",
    origin: true,
    credentials: true,
  },
  namespace: "/rooms",
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<
    string,
    { userId: number; username: string; roomId: number; clientId: string }
  >();

  private roomCodeStates = new Map<number, string>();

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
    console.log(`[WebSocket] Client auth:`, client.handshake.auth);
    console.log(`[WebSocket] Client headers:`, client.handshake.headers);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
    console.log(
      `[WebSocket] Remaining connected users:`,
      this.connectedUsers.size
    );
  }

  @SubscribeMessage("join_room")
  async handleJoinRoom(
    @MessageBody() data: JoinRoomEvent,
    @ConnectedSocket() client: Socket
  ) {
    console.log(`[WebSocket] join_room event received:`, data);
    console.log(`[WebSocket] Client ID: ${client.id}`);

    const { roomId, userId, username } = data;

    // roomId를 숫자로 변환
    const numericRoomId =
      typeof roomId === "string" ? parseInt(roomId, 10) : roomId;

    // 클라이언트를 방에 참가시킴
    await client.join(`room_${numericRoomId}`);
    console.log(`[WebSocket] Client ${client.id} joined room_${numericRoomId}`);

    // 연결된 사용자 정보 저장
    this.connectedUsers.set(client.id, {
      userId,
      username,
      roomId: numericRoomId,
      clientId: client.id,
    });
    console.log(
      `[WebSocket] Connected users:`,
      Array.from(this.connectedUsers.entries())
    );

    // 방의 모든 사용자에게 참가 알림 (자신 포함)
    this.server.to(`room_${numericRoomId}`).emit("user_joined", {
      userId,
      username,
      timestamp: new Date(),
    });
    console.log(`[WebSocket] Emitted user_joined to room_${numericRoomId}`);

    // 새로 참가한 사용자에게 현재 방의 모든 참가자 정보 전송
    console.log(
      `[WebSocket] All connected users:`,
      Array.from(this.connectedUsers.entries())
    );

    // 현재 방의 모든 소켓 클라이언트 확인
    const roomSockets = await this.server
      .in(`room_${numericRoomId}`)
      .fetchSockets();
    console.log(
      `[WebSocket] Room ${numericRoomId} sockets:`,
      roomSockets.map((s) => s.id)
    );

    client.emit("room_participants", {
      participants: Array.from(this.connectedUsers.values()).filter(
        (user) => user.roomId === numericRoomId
      ),
      timestamp: new Date(),
    });

    // 현재 방의 코드 상태 전송
    const currentCode = this.roomCodeStates.get(numericRoomId) || "";
    client.emit("room_code_state", {
      code: currentCode,
      timestamp: new Date(),
    });
    console.log(
      `[WebSocket] Sent room_code_state to new user:`,
      currentCode.substring(0, 100) + "..."
    );

    // 방 참가자 수 업데이트를 모든 클라이언트에게 브로드캐스트
    const roomParticipants = Array.from(this.connectedUsers.values()).filter(
      (user) => user.roomId === numericRoomId
    );
    this.server.emit("room_list_updated", {
      roomId: numericRoomId,
      participantCount: roomParticipants.length,
      participants: roomParticipants,
      timestamp: new Date(),
    });

    console.log(`[WebSocket] User ${username} joined room ${numericRoomId}`);
  }

  @SubscribeMessage("leave_room")
  async handleLeaveRoom(
    @MessageBody() data: LeaveRoomEvent,
    @ConnectedSocket() client: Socket
  ) {
    console.log(`[WebSocket] leave_room event received:`, data);

    const { roomId, userId, username } = data;

    // roomId를 숫자로 변환
    const numericRoomId =
      typeof roomId === "string" ? parseInt(roomId, 10) : roomId;

    // 클라이언트를 방에서 나가게 함
    await client.leave(`room_${numericRoomId}`);
    console.log(`[WebSocket] Client ${client.id} left room_${numericRoomId}`);

    // 연결된 사용자 정보 제거
    this.connectedUsers.delete(client.id);
    console.log(
      `[WebSocket] Connected users after leave:`,
      Array.from(this.connectedUsers.entries())
    );

    // 방의 다른 사용자들에게 나가기 알림
    client.to(`room_${numericRoomId}`).emit("user_left", {
      userId,
      username,
      timestamp: new Date(),
    });
    console.log(`[WebSocket] Emitted user_left to room_${numericRoomId}`);

    // 방 참가자 수 업데이트를 모든 클라이언트에게 브로드캐스트
    const roomParticipants = Array.from(this.connectedUsers.values()).filter(
      (user) => user.roomId === numericRoomId
    );
    this.server.emit("room_list_updated", {
      roomId: numericRoomId,
      participantCount: roomParticipants.length,
      participants: roomParticipants,
      timestamp: new Date(),
    });

    console.log(`[WebSocket] User ${username} left room ${numericRoomId}`);
  }

  @SubscribeMessage("code_change")
  async handleCodeChange(
    @MessageBody() data: CodeChangeEvent,
    @ConnectedSocket() client: Socket
  ) {
    console.log(`[WebSocket] code_change event received:`, data);

    const { roomId, code, editorId, editorName, clientId } = data;

    // roomId를 숫자로 변환
    const numericRoomId =
      typeof roomId === "string" ? parseInt(roomId, 10) : roomId;

    // 방의 코드 상태 업데이트
    this.roomCodeStates.set(numericRoomId, code);

    // 방의 다른 사용자들에게 코드 변경 알림
    client.to(`room_${numericRoomId}`).emit("code_updated", {
      code,
      editorId,
      editorName,
      clientId: clientId || client.id,
      timestamp: new Date(),
    });
    console.log(`[WebSocket] Emitted code_updated to room_${numericRoomId}`);

    console.log(
      `[WebSocket] Code changed in room ${numericRoomId} by ${editorName}`
    );
  }

  @SubscribeMessage("chat_message")
  async handleChatMessage(
    @MessageBody() data: ChatMessageEvent,
    @ConnectedSocket() client: Socket
  ) {
    console.log(`[WebSocket] chat_message event received:`, data);

    const { roomId, userId, username, message } = data;

    // roomId를 숫자로 변환
    const numericRoomId =
      typeof roomId === "string" ? parseInt(roomId, 10) : roomId;

    // 방의 모든 사용자에게 채팅 메시지 전송
    this.server.to(`room_${numericRoomId}`).emit("new_message", {
      userId,
      username,
      message,
      timestamp: new Date(),
    });
    console.log(`[WebSocket] Emitted new_message to room_${numericRoomId}`);

    console.log(
      `[WebSocket] Chat message in room ${numericRoomId} from ${username}: ${message}`
    );
  }

  @SubscribeMessage("submission_result")
  async handleSubmissionResult(
    @MessageBody() data: SubmissionEvent,
    @ConnectedSocket() client: Socket
  ) {
    const { roomId, submissionId, problemId, status, resultMessage } = data;

    // roomId를 숫자로 변환
    const numericRoomId =
      typeof roomId === "string" ? parseInt(roomId, 10) : roomId;

    // 방의 모든 사용자에게 제출 결과 전송
    this.server.to(`room_${numericRoomId}`).emit("submission_updated", {
      submissionId,
      problemId,
      status,
      resultMessage,
      timestamp: new Date(),
    });

    console.log(`Submission result in room ${numericRoomId}: ${status}`);
  }

  // 서버에서 직접 이벤트를 보내는 메서드들
  async broadcastCodeChange(
    roomId: number,
    code: string,
    editorId: number,
    editorName: string
  ) {
    console.log(`[WebSocket] Broadcasting code change to room ${roomId}`);
    this.server.to(`room_${roomId}`).emit("code_updated", {
      code,
      editorId,
      editorName,
      timestamp: new Date(),
    });
  }

  async broadcastChatMessage(
    roomId: number,
    userId: number,
    username: string,
    message: string
  ) {
    console.log(`[WebSocket] Broadcasting chat message to room ${roomId}`);
    this.server.to(`room_${roomId}`).emit("new_message", {
      userId,
      username,
      message,
      timestamp: new Date(),
    });
  }

  async broadcastSubmissionResult(
    roomId: number,
    submissionId: number,
    problemId: number,
    status: string,
    resultMessage?: string
  ) {
    console.log(`[WebSocket] Broadcasting submission result to room ${roomId}`);
    this.server.to(`room_${roomId}`).emit("submission_updated", {
      submissionId,
      problemId,
      status,
      resultMessage,
      timestamp: new Date(),
    });
  }

  async broadcastRoomUpdate(roomId: number, roomData: any) {
    console.log(`[WebSocket] Broadcasting room update to room ${roomId}`);
    // 방 내부 사용자들에게 전송
    this.server.to(`room_${roomId}`).emit("room_updated", {
      ...roomData,
      timestamp: new Date(),
    });

    // 방 목록 페이지 사용자들에게도 전송 (전체 브로드캐스트)
    this.server.emit("room_list_updated", {
      ...roomData,
      timestamp: new Date(),
    });
  }

  // 연결된 사용자 목록 가져오기
  getConnectedUsers(): Map<
    string,
    { userId: number; username: string; roomId: number; clientId: string }
  > {
    return this.connectedUsers;
  }
}
