import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateChatMessageDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
} 