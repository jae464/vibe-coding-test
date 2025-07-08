import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { Problem } from '../../entities/Problem';
import { Testcase } from '../../entities/Testcase';

@Module({
  imports: [TypeOrmModule.forFeature([Problem, Testcase])],
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {} 