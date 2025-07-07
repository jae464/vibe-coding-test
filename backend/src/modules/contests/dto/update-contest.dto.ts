import { PartialType } from '@nestjs/mapped-types';
import { CreateContestDto } from './create-contest.dto';

export class UpdateContestDto extends PartialType(CreateContestDto) {} 