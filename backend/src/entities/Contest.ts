import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Room } from "./Room";
import { Problem } from "./Problem";

@Entity()
export class Contest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column({ name: "start_time" })
  startTime: Date;

  @Column({ name: "end_time" })
  endTime: Date;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Room, (room) => room.contest)
  rooms: Room[];

  @OneToMany(() => Problem, (problem) => problem.contest)
  problems: Problem[];
}
