import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column("text")
  message: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Room, (room) => room.messages)
  @JoinColumn({ name: "room_id" })
  room: Room;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn({ name: "user_id" })
  user: User;
}
