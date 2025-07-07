import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Problem } from "./Problem";

@Entity()
export class Testcase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "problem_id" })
  problemId: number;

  @Column({ type: "text" })
  input: string;

  @Column({ type: "text" })
  output: string;

  @Column({ name: "is_sample", default: false })
  isSample: boolean;

  @Column({ default: 1 })
  order: number;

  // Relations
  @ManyToOne(() => Problem, (problem) => problem.testcases)
  @JoinColumn({ name: "problem_id" })
  problem: Problem;
}
