import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateProblemDto {
  @IsNumber()
  contestId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  inputDescription: string;

  @IsString()
  @IsNotEmpty()
  outputDescription: string;

  @IsString()
  @IsNotEmpty()
  sampleInput: string;

  @IsString()
  @IsNotEmpty()
  sampleOutput: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @IsOptional()
  @IsNumber()
  memoryLimit?: number;
} 