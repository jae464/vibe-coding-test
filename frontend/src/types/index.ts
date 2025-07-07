// 사용자 관련 타입
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 대회 관련 타입
export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 문제 관련 타입
export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimit: number;
  memoryLimit: number;
  contestId?: number;
  createdAt: string;
  updatedAt: string;
}

// 방 관련 타입
export interface Room {
  id: string;
  name: string;
  contestId: string;
  problemId: string;
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contest?: Contest;
  problem?: Problem;
  participants?: RoomUser[];
}

// 방 참가자 타입
export interface RoomUser {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  user?: User;
}

// 제출 관련 타입
export interface Submission {
  id: string;
  roomId: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  status:
    | "PENDING"
    | "RUNNING"
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "RUNTIME_ERROR"
    | "COMPILATION_ERROR";
  executionTime?: number;
  memoryUsed?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  problem?: Problem;
}

// 채점 결과 타입
export interface JudgeResult {
  submissionId: string;
  status: string;
  executionTime?: number;
  memoryUsed?: number;
  testCases: TestCaseResult[];
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isPassed: boolean;
  executionTime: number;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: User;
  // WebSocket에서 전송되는 메시지용 필드
  timestamp?: string;
  username?: string;
}

// WebSocket 이벤트 타입
export interface SocketEvents {
  // 방 관련
  "join-room": (data: { roomId: string; userId: string }) => void;
  "leave-room": (data: { roomId: string; userId: string }) => void;
  "user-joined": (data: { user: User }) => void;
  "user-left": (data: { user: User }) => void;

  // 코드 편집 관련
  "code-change": (data: { code: string; userId: string }) => void;
  "code-sync": (data: { code: string; userId: string }) => void;

  // 채팅 관련
  "chat-message": (data: ChatMessage) => void;
  "send-message": (data: { message: string; roomId: string }) => void;

  // 제출 관련
  "submission-result": (data: JudgeResult) => void;
  "submission-status": (data: { submissionId: string; status: string }) => void;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 타입
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
