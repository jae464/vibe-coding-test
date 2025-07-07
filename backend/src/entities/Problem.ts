import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Contest } from "./Contest";
import { Submission } from "./Submission";
import { Testcase } from "./Testcase";

@Entity()
export class Problem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "contest_id" })
  contestId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "input_description", type: "text" })
  inputDescription: string;

  @Column({ name: "output_description", type: "text" })
  outputDescription: string;

  @Column({ name: "sample_input", type: "text" })
  sampleInput: string;

  @Column({ name: "sample_output", type: "text" })
  sampleOutput: string;

  @Column({ default: 1 })
  order: number;

  @Column({ default: 1000 })
  timeLimit: number; // milliseconds

  @Column({ default: 128 })
  memoryLimit: number; // MB

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Contest, (contest) => contest.problems)
  @JoinColumn({ name: "contest_id" })
  contest: Contest;

  @OneToMany(() => Submission, (submission) => submission.problem)
  submissions: Submission[];

  @OneToMany(() => Testcase, (testcase) => testcase.problem)
  testcases: Testcase[];
}
