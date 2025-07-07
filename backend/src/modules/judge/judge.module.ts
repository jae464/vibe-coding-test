import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JudgeService } from './judge.service';
import { JudgeController } from './judge.controller';
import { Submission } from '../../entities/Submission';
import { Problem } from '../../entities/Problem';
import { Testcase } from '../../entities/Testcase';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Problem, Testcase]),
    RoomsModule,
  ],
  controllers: [JudgeController],
  providers: [JudgeService],
  exports: [JudgeService],
})
export class JudgeModule {} 