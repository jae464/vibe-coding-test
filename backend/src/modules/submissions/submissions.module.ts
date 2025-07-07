import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission } from '../../entities/Submission';
import { JudgeModule } from '../judge/judge.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission]),
    JudgeModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {} 