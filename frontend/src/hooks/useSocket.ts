import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { SocketEvents, ChatMessage, User } from '@/types';

interface UseSocketOptions {
  roomId?: string;
  onCodeChange?: (code: string, userId: string) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (user: User) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onSubmissionResult?: (result: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const { user, token } = useAuthStore();

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    socketRef.current = io('http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    // 연결 이벤트
    socketRef.current.on('connect', () => {
      console.log('WebSocket 연결됨');
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket 연결 해제됨');
    });

    // 방 관련 이벤트
    if (options.roomId) {
      socketRef.current.emit('join-room', {
        roomId: options.roomId,
        userId: user?.id,
      });

      socketRef.current.on('user-joined', (data) => {
        console.log('사용자 참가:', data.user);
        options.onUserJoined?.(data.user);
      });

      socketRef.current.on('user-left', (data) => {
        console.log('사용자 퇴장:', data.user);
        options.onUserLeft?.(data.user);
      });
    }

    // 코드 편집 이벤트
    socketRef.current.on('code-change', (data) => {
      console.log('코드 변경:', data);
      options.onCodeChange?.(data.code, data.userId);
    });

    socketRef.current.on('code-sync', (data) => {
      console.log('코드 동기화:', data);
      options.onCodeChange?.(data.code, data.userId);
    });

    // 채팅 이벤트
    socketRef.current.on('chat-message', (data) => {
      console.log('채팅 메시지:', data);
      options.onChatMessage?.(data);
    });

    // 제출 결과 이벤트
    socketRef.current.on('submission-result', (data) => {
      console.log('제출 결과:', data);
      options.onSubmissionResult?.(data);
    });

    socketRef.current.on('submission-status', (data) => {
      console.log('제출 상태:', data);
    });
  }, [token, user?.id, options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const sendCodeChange = useCallback((code: string) => {
    if (options.roomId) {
      emit('code-change', {
        roomId: options.roomId,
        code,
        userId: user?.id,
      });
    }
  }, [options.roomId, user?.id, emit]);

  const sendChatMessage = useCallback((message: string) => {
    if (options.roomId) {
      emit('send-message', {
        roomId: options.roomId,
        message,
      });
    }
  }, [options.roomId, emit]);

  const leaveRoom = useCallback(() => {
    if (options.roomId && user?.id) {
      emit('leave-room', {
        roomId: options.roomId,
        userId: user.id,
      });
    }
  }, [options.roomId, user?.id, emit]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    emit,
    sendCodeChange,
    sendChatMessage,
    leaveRoom,
  };
}; 