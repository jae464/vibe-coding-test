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
export class RoomUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "room_id" })
  roomId: number;

  @Column({ name: "user_id" })
  userId: number;

  @CreateDateColumn({ name: "joined_at" })
  joinedAt: Date;

  // Relations
  @ManyToOne(() => Room, (room) => room.roomUsers)
  @JoinColumn({ name: "room_id" })
  room: Room;

  @ManyToOne(() => User, (user) => user.roomUsers)
  @JoinColumn({ name: "user_id" })
  user: User;
}
