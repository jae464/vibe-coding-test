import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSubmissionDto {
  @IsNumber()
  problemId: number;

  @IsNumber()
  userId: number;

  @IsNumber()
  roomId: number;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  language: string;
} 