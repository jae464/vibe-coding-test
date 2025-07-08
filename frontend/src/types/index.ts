// 사용자 관련 타입
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 대회 관련 타입
export interface Contest {
  id: number;
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
  id: number;
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
  id: number;
  name: string;
  contestId: number;
  problemId: number;
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contest?: Contest;
  problem?: Problem;
  participants?: RoomUser[];
  participantCount?: number;
}

// 방 참가자 타입
export interface RoomUser {
  id: number;
  roomId: number;
  userId: number;
  joinedAt: string;
  user?: User;
}

// 제출 관련 타입
export interface Submission {
  id: number;
  roomId: number;
  userId: number;
  problemId: number;
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
  id: number;
  roomId: number;
  userId: number;
  message: string;
  createdAt: string;
  user?: User;
  // WebSocket에서 전송되는 메시지용 필드
  timestamp?: string;
  username?: string;
}

// 터미널 관련 타입
export interface TerminalSession {
  id: string;
  userId: string;
  containerId: string;
  language: string;
  createdAt: string;
  lastActivity: string;
}

export interface TerminalCommand {
  sessionId: string;
  command: string;
  output: string;
  error?: string;
  exitCode: number;
}

export interface TerminalFile {
  filename: string;
  content: string;
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

  // 터미널 관련
  create_session: (data: { language?: string }) => void;
  execute_command: (data: { sessionId: string; command: string }) => void;
  create_file: (data: {
    sessionId: string;
    filename: string;
    content: string;
  }) => void;
  read_file: (data: { sessionId: string; filename: string }) => void;
  destroy_session: (data: { sessionId: string }) => void;
  list_sessions: () => void;
  system_info: () => void;
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
