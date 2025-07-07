import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Room } from "./Room";
import { Problem } from "./Problem";

@Entity()
export class Contest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "start_time", type: "timestamp" })
  startTime: Date;

  @Column({ name: "end_time", type: "timestamp" })
  endTime: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => Room, (room) => room.contest)
  rooms: Room[];

  @OneToMany(() => Problem, (problem) => problem.contest)
  problems: Problem[];
}
