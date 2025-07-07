import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import { SocketEvents, ChatMessage, User } from "@/types";

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
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected || isConnectingRef.current)
      return;

    isConnectingRef.current = true;
    console.log("WebSocket 연결 시도...");

    socketRef.current = io("http://localhost:3001/rooms", {
      auth: {
        token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // 연결 이벤트
    socketRef.current.on("connect", () => {
      console.log("WebSocket 연결됨");
      isConnectingRef.current = false;

      // 방 참가
      if (options.roomId && user?.id) {
        socketRef.current?.emit("join_room", {
          roomId: options.roomId,
          userId: user.id,
          username: user.username,
        });
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("WebSocket 연결 해제됨");
      isConnectingRef.current = false;
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("WebSocket 연결 오류:", error);
      isConnectingRef.current = false;
    });

    // 방 관련 이벤트
    socketRef.current.on("user_joined", (data) => {
      console.log("사용자 참가:", data);
      options.onUserJoined?.(data);
    });

    socketRef.current.on("user_left", (data) => {
      console.log("사용자 퇴장:", data);
      options.onUserLeft?.(data);
    });

    // 코드 편집 이벤트
    socketRef.current.on("code_updated", (data) => {
      console.log("코드 변경:", data);
      options.onCodeChange?.(data.code, data.editorId);
    });

    // 채팅 이벤트
    socketRef.current.on("new_message", (data) => {
      console.log("채팅 메시지:", data);
      options.onChatMessage?.(data);
    });

    // 제출 결과 이벤트
    socketRef.current.on("submission_updated", (data) => {
      console.log("제출 결과:", data);
      options.onSubmissionResult?.(data);
    });
  }, [token, user?.id, user?.username, options.roomId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("WebSocket이 연결되지 않음");
    }
  }, []);

  const sendCodeChange = useCallback(
    (code: string) => {
      if (options.roomId && user?.id) {
        emit("code_change", {
          roomId: options.roomId,
          code,
          editorId: user.id,
          editorName: user.username,
        });
      }
    },
    [options.roomId, user?.id, user?.username, emit]
  );

  const sendChatMessage = useCallback(
    (message: string) => {
      if (options.roomId && user?.id) {
        emit("chat_message", {
          roomId: options.roomId,
          userId: user.id,
          username: user.username,
          message,
        });
      }
    },
    [options.roomId, user?.id, user?.username, emit]
  );

  const leaveRoom = useCallback(() => {
    if (options.roomId && user?.id) {
      emit("leave_room", {
        roomId: options.roomId,
        userId: user.id,
        username: user.username,
      });
    }
  }, [options.roomId, user?.id, user?.username, emit]);

  useEffect(() => {
    connect();

    return () => {
      leaveRoom();
      disconnect();
    };
  }, [connect, disconnect, leaveRoom]);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    emit,
    sendCodeChange,
    sendChatMessage,
    leaveRoom,
  };
};
