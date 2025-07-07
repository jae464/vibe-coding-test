import { IsString, IsNotEmpty, IsNumber, IsArray } from 'class-validator';

export class JudgeRequestDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsNumber()
  problemId: number;

  @IsNumber()
  submissionId: number;

  @IsArray()
  testcases: Array<{
    input: string;
    output: string;
    isSample: boolean;
  }>;

  @IsNumber()
  timeLimit: number; // milliseconds

  @IsNumber()
  memoryLimit: number; // MB
} 