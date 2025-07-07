import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column("text")
  input: string;

  @Column("text")
  output: string;

  @Column({ name: "is_sample", default: false })
  isSample: boolean;

  @Column({ name: "order_index", default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Problem, (problem) => problem.testcases)
  @JoinColumn({ name: "problem_id" })
  problem: Problem;
}
