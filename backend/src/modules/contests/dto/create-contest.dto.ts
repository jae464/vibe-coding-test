import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsBoolean,
} from "class-validator";

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
