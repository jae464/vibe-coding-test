export interface CodeChangeEvent {
  roomId: number;
  code: string;
  editorId: number;
  editorName: string;
}

export interface JoinRoomEvent {
  roomId: number;
  userId: number;
  username: string;
}

export interface LeaveRoomEvent {
  roomId: number;
  userId: number;
  username: string;
}

export interface ChatMessageEvent {
  roomId: number;
  userId: number;
  username: string;
  message: string;
}

export interface SubmissionEvent {
  roomId: number;
  submissionId: number;
  problemId: number;
  status: string;
  resultMessage?: string;
} 