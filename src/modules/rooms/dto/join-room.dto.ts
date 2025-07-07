import { IsNumber } from 'class-validator';

export class JoinRoomDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  userId: number;
} 