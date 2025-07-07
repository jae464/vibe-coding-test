import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Problem } from "./Problem";
import { User } from "./User";
import { Room } from "./Room";

export enum SubmissionStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  WRONG_ANSWER = "wrong_answer",
  RUNTIME_ERROR = "runtime_error",
  TIME_LIMIT_EXCEEDED = "time_limit_exceeded",
  MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded",
  COMPILATION_ERROR = "compilation_error",
}

@Entity()
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "problem_id" })
  problemId: number;

  @Column({ name: "user_id" })
  userId: number;

  @Column({ name: "room_id" })
  roomId: number;

  @Column({ type: "text" })
  code: string;

  @Column({ length: 20 })
  language: string;

  @Column({
    type: "enum",
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ name: "result_message", type: "text", nullable: true })
  resultMessage: string;

  @Column({ type: "int", default: 0 })
  score: number;

  @Column({ name: "execution_time", type: "int", nullable: true })
  executionTime: number; // milliseconds

  @Column({ name: "memory_used", type: "int", nullable: true })
  memoryUsed: number; // KB

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Problem, (problem) => problem.submissions)
  @JoinColumn({ name: "problem_id" })
  problem: Problem;

  @ManyToOne(() => User, (user) => user.submissions)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Room, (room) => room.submissions)
  @JoinColumn({ name: "room_id" })
  room: Room;
}
