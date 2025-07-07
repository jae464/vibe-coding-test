export enum JudgeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  RUNTIME_ERROR = 'runtime_error',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  COMPILATION_ERROR = 'compilation_error',
  SYSTEM_ERROR = 'system_error',
}

export interface TestCaseResult {
  testcaseId: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isCorrect: boolean;
  executionTime: number; // milliseconds
  memoryUsed: number; // KB
  errorMessage?: string;
}

export class JudgeResultDto {
  submissionId: number;
  status: JudgeStatus;
  totalTestcases: number;
  passedTestcases: number;
  testcaseResults: TestCaseResult[];
  totalExecutionTime: number; // milliseconds
  maxMemoryUsed: number; // KB
  compilationError?: string;
  systemError?: string;
} 