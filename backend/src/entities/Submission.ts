import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Room } from "./Room";
import { Problem } from "./Problem";

export enum SubmissionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  ACCEPTED = "ACCEPTED",
  WRONG_ANSWER = "WRONG_ANSWER",
  TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
  RUNTIME_ERROR = "RUNTIME_ERROR",
  COMPILATION_ERROR = "COMPILATION_ERROR",
}

@Entity()
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "room_id" })
  roomId: number;

  @Column({ name: "user_id" })
  userId: number;

  @Column({ name: "problem_id" })
  problemId: number;

  @Column("text")
  code: string;

  @Column()
  language: string;

  @Column({
    type: "enum",
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ name: "execution_time", nullable: true })
  executionTime?: number;

  @Column({ name: "memory_used", nullable: true })
  memoryUsed?: number;

  @Column({ name: "result_message", type: "text", nullable: true })
  resultMessage?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Room, (room) => room.submissions)
  @JoinColumn({ name: "room_id" })
  room: Room;

  @ManyToOne(() => User, (user) => user.submissions)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Problem, (problem) => problem.submissions)
  @JoinColumn({ name: "problem_id" })
  problem: Problem;
}
