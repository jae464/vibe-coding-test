import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateContestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
} 