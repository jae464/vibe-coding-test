# WebSocket 클라이언트 사용 예시

## 연결 설정

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/rooms', {
  auth: {
    token: 'your-jwt-token' // JWT 토큰
  }
});

// 연결 이벤트
socket.on('connect', () => {
  console.log('WebSocket 연결됨');
});

socket.on('disconnect', () => {
  console.log('WebSocket 연결 해제됨');
});
```

## 방 참가/나가기

```javascript
// 방 참가
socket.emit('join_room', {
  roomId: 1,
  userId: 123,
  username: 'user1'
});

// 방 나가기
socket.emit('leave_room', {
  roomId: 1,
  userId: 123,
  username: 'user1'
});

// 사용자 참가 이벤트 수신
socket.on('user_joined', (data) => {
  console.log(`${data.username}님이 방에 참가했습니다.`);
});

// 사용자 나가기 이벤트 수신
socket.on('user_left', (data) => {
  console.log(`${data.username}님이 방을 나갔습니다.`);
});
```

## 실시간 코드 동기화

```javascript
// 코드 변경 이벤트 전송
socket.emit('code_change', {
  roomId: 1,
  code: 'console.log("Hello World");',
  editorId: 123,
  editorName: 'user1'
});

// 코드 변경 이벤트 수신
socket.on('code_updated', (data) => {
  console.log('코드가 업데이트되었습니다:', data.code);
  console.log('편집자:', data.editorName);
  // 에디터에 코드 반영
  updateEditor(data.code);
});
```

## 실시간 채팅

```javascript
// 채팅 메시지 전송
socket.emit('chat_message', {
  roomId: 1,
  userId: 123,
  username: 'user1',
  message: '안녕하세요!'
});

// 채팅 메시지 수신
socket.on('new_message', (data) => {
  console.log(`${data.username}: ${data.message}`);
  // 채팅 UI에 메시지 추가
  addChatMessage(data);
});
```

## 제출 결과 수신

```javascript
// 제출 결과 수신
socket.on('submission_updated', (data) => {
  console.log('제출 결과:', data.status);
  console.log('결과 메시지:', data.resultMessage);
  // UI에 결과 표시
  updateSubmissionResult(data);
});
```

## React Hook 예시

```javascript
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(roomId: number, userId: number, username: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // WebSocket 연결
    socketRef.current = io('http://localhost:3001/rooms', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // 방 참가
    socketRef.current.emit('join_room', {
      roomId,
      userId,
      username
    });

    // 이벤트 리스너 등록
    socketRef.current.on('code_updated', (data) => {
      // 코드 업데이트 처리
    });

    socketRef.current.on('new_message', (data) => {
      // 채팅 메시지 처리
    });

    socketRef.current.on('user_joined', (data) => {
      // 사용자 참가 처리
    });

    socketRef.current.on('user_left', (data) => {
      // 사용자 나가기 처리
    });

    return () => {
      // 방 나가기
      socketRef.current?.emit('leave_room', {
        roomId,
        userId,
        username
      });
      
      // 연결 해제
      socketRef.current?.disconnect();
    };
  }, [roomId, userId, username]);

  return socketRef.current;
}
```

## 에러 처리

```javascript
socket.on('connect_error', (error) => {
  console.error('연결 에러:', error);
});

socket.on('error', (error) => {
  console.error('WebSocket 에러:', error);
});
```

## 이벤트 타입 정의 (TypeScript)

```typescript
interface CodeChangeEvent {
  roomId: number;
  code: string;
  editorId: number;
  editorName: string;
}

interface ChatMessageEvent {
  roomId: number;
  userId: number;
  username: string;
  message: string;
}

interface SubmissionEvent {
  submissionId: number;
  problemId: number;
  status: string;
  resultMessage?: string;
}
``` 