import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Room } from "./Room";
import { User } from "./User";

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "room_id" })
  roomId: number;

  @Column({ name: "user_id" })
  userId: number;

  @Column({ type: "text" })
  message: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Room, (room) => room.chatMessages)
  @JoinColumn({ name: "room_id" })
  room: Room;

  @ManyToOne(() => User, (user) => user.chatMessages)
  @JoinColumn({ name: "user_id" })
  user: User;
}
