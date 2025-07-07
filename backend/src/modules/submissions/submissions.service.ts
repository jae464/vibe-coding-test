import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../../entities/Submission';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JudgeService } from '../judge/judge.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    private judgeService: JudgeService,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    const submission = this.submissionsRepository.create({
      ...createSubmissionDto,
      status: SubmissionStatus.PENDING,
    });

    const savedSubmission = await this.submissionsRepository.save(submission);

    // 비동기로 채점 실행
    this.judgeSubmissionAsync(savedSubmission.id);

    return savedSubmission;
  }

  async findAll(): Promise<Submission[]> {
    return this.submissionsRepository.find({
      relations: ['problem', 'user', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Submission> {
    const submission = await this.submissionsRepository.findOne({
      where: { id },
      relations: ['problem', 'user', 'room'],
    });

    if (!submission) {
      throw new NotFoundException('제출을 찾을 수 없습니다.');
    }

    return submission;
  }

  async findByUser(userId: number): Promise<Submission[]> {
    return this.submissionsRepository.find({
      where: { userId },
      relations: ['problem', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRoom(roomId: number): Promise<Submission[]> {
    return this.submissionsRepository.find({
      where: { roomId },
      relations: ['problem', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProblem(problemId: number): Promise<Submission[]> {
    return this.submissionsRepository.find({
      where: { problemId },
      relations: ['user', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: SubmissionStatus, resultMessage?: string): Promise<Submission> {
    const submission = await this.findOne(id);
    
    submission.status = status;
    if (resultMessage) {
      submission.resultMessage = resultMessage;
    }

    return this.submissionsRepository.save(submission);
  }

  async remove(id: number): Promise<void> {
    const submission = await this.findOne(id);
    await this.submissionsRepository.remove(submission);
  }

  // 비동기 채점 실행
  private async judgeSubmissionAsync(submissionId: number): Promise<void> {
    try {
      await this.judgeService.judgeSubmission(submissionId);
    } catch (error) {
      console.error(`채점 중 오류 발생 (submission ${submissionId}):`, error);
      
      // 채점 실패 시 상태 업데이트
      await this.updateStatus(submissionId, SubmissionStatus.RUNTIME_ERROR, '채점 중 오류가 발생했습니다.');
    }
  }

  // 즉시 채점 실행 (테스트용)
  async judgeSubmissionSync(submissionId: number): Promise<any> {
    return this.judgeService.judgeSubmission(submissionId);
  }
} 