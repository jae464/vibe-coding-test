import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  contestId: number;

  @IsNumber()
  createdBy: number;
} 