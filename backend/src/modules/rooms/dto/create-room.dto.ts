import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  contestId: number;

  @IsNumber()
  problemId: number;

  @IsNumber()
  createdBy: number;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;
}
