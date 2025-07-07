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
import { User } from "./User";
import { RoomUser } from "./RoomUser";
import { Submission } from "./Submission";
import { ChatMessage } from "./ChatMessage";

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "contest_id" })
  contestId: number;

  @Column({ name: "created_by" })
  createdBy: number;

  @Column({ type: "text", nullable: true })
  lastCode: string;

  @Column({ name: "last_editor_id", nullable: true })
  lastEditorId: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Contest, (contest) => contest.rooms)
  @JoinColumn({ name: "contest_id" })
  contest: Contest;

  @ManyToOne(() => User, (user) => user.roomUsers)
  @JoinColumn({ name: "created_by" })
  creator: User;

  @OneToMany(() => RoomUser, (roomUser) => roomUser.room)
  roomUsers: RoomUser[];

  @OneToMany(() => Submission, (submission) => submission.room)
  submissions: Submission[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.room)
  chatMessages: ChatMessage[];
}
