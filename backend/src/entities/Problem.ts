import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Contest } from "./Contest";
import { Room } from "./Room";
import { Submission } from "./Submission";
import { Testcase } from "./Testcase";

export enum ProblemDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

@Entity()
export class Problem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column({
    type: "enum",
    enum: ProblemDifficulty,
    default: ProblemDifficulty.EASY,
  })
  difficulty: ProblemDifficulty;

  @Column({ name: "time_limit", default: 1000 })
  timeLimit: number;

  @Column({ name: "memory_limit", default: 128 })
  memoryLimit: number;

  @Column({ name: "contest_id", nullable: true })
  contestId?: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Contest, (contest) => contest.problems)
  @JoinColumn({ name: "contest_id" })
  contest?: Contest;

  @OneToMany(() => Room, (room) => room.problem)
  rooms: Room[];

  @OneToMany(() => Submission, (submission) => submission.problem)
  submissions: Submission[];

  @OneToMany(() => Testcase, (testcase) => testcase.problem)
  testcases: Testcase[];
}
