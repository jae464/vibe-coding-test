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
import { Problem } from "./Problem";
import { RoomUser } from "./RoomUser";
import { Submission } from "./Submission";
import { ChatMessage } from "./ChatMessage";
import { User } from "./User";

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: "contest_id" })
  contestId: number;

  @Column({ name: "problem_id" })
  problemId: number;

  @Column({ name: "created_by" })
  createdBy: number;

  @Column({ name: "max_participants", default: 10 })
  maxParticipants: number;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Contest, (contest) => contest.rooms)
  @JoinColumn({ name: "contest_id" })
  contest: Contest;

  @ManyToOne(() => Problem, (problem) => problem.rooms)
  @JoinColumn({ name: "problem_id" })
  problem: Problem;

  @ManyToOne(() => User, (user) => user.createdRooms)
  @JoinColumn({ name: "created_by" })
  creator: User;

  @OneToMany(() => RoomUser, (roomUser) => roomUser.room)
  roomUsers: RoomUser[];

  @OneToMany(() => Submission, (submission) => submission.room)
  submissions: Submission[];

  @OneToMany(() => ChatMessage, (message) => message.room)
  messages: ChatMessage[];
}
