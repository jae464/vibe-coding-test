import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import {
  CodeChangeEvent,
  JoinRoomEvent,
  LeaveRoomEvent,
  ChatMessageEvent,
  SubmissionEvent,
} from './events/room.events';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/rooms',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, { userId: number; username: string }>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomEvent,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, username } = data;
    
    // 클라이언트를 방에 참가시킴
    await client.join(`room_${roomId}`);
    
    // 연결된 사용자 정보 저장
    this.connectedUsers.set(client.id, { userId, username });
    
    // 방의 다른 사용자들에게 참가 알림
    client.to(`room_${roomId}`).emit('user_joined', {
      userId,
      username,
      timestamp: new Date(),
    });

    console.log(`User ${username} joined room ${roomId}`);
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: LeaveRoomEvent,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, username } = data;
    
    // 클라이언트를 방에서 나가게 함
    await client.leave(`room_${roomId}`);
    
    // 연결된 사용자 정보 제거
    this.connectedUsers.delete(client.id);
    
    // 방의 다른 사용자들에게 나가기 알림
    client.to(`room_${roomId}`).emit('user_left', {
      userId,
      username,
      timestamp: new Date(),
    });

    console.log(`User ${username} left room ${roomId}`);
  }

  @SubscribeMessage('code_change')
  async handleCodeChange(
    @MessageBody() data: CodeChangeEvent,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, code, editorId, editorName } = data;
    
    // 방의 다른 사용자들에게 코드 변경 알림
    client.to(`room_${roomId}`).emit('code_updated', {
      code,
      editorId,
      editorName,
      timestamp: new Date(),
    });

    console.log(`Code changed in room ${roomId} by ${editorName}`);
  }

  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @MessageBody() data: ChatMessageEvent,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId, username, message } = data;
    
    // 방의 모든 사용자에게 채팅 메시지 전송
    this.server.to(`room_${roomId}`).emit('new_message', {
      userId,
      username,
      message,
      timestamp: new Date(),
    });

    console.log(`Chat message in room ${roomId} from ${username}: ${message}`);
  }

  @SubscribeMessage('submission_result')
  async handleSubmissionResult(
    @MessageBody() data: SubmissionEvent,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, submissionId, problemId, status, resultMessage } = data;
    
    // 방의 모든 사용자에게 제출 결과 전송
    this.server.to(`room_${roomId}`).emit('submission_updated', {
      submissionId,
      problemId,
      status,
      resultMessage,
      timestamp: new Date(),
    });

    console.log(`Submission result in room ${roomId}: ${status}`);
  }

  // 서버에서 직접 이벤트를 보내는 메서드들
  async broadcastCodeChange(roomId: number, code: string, editorId: number, editorName: string) {
    this.server.to(`room_${roomId}`).emit('code_updated', {
      code,
      editorId,
      editorName,
      timestamp: new Date(),
    });
  }

  async broadcastChatMessage(roomId: number, userId: number, username: string, message: string) {
    this.server.to(`room_${roomId}`).emit('new_message', {
      userId,
      username,
      message,
      timestamp: new Date(),
    });
  }

  async broadcastSubmissionResult(roomId: number, submissionId: number, problemId: number, status: string, resultMessage?: string) {
    this.server.to(`room_${roomId}`).emit('submission_updated', {
      submissionId,
      problemId,
      status,
      resultMessage,
      timestamp: new Date(),
    });
  }
} 