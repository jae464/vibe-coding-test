import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../../entities/Submission';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    const submission = this.submissionsRepository.create({
      ...createSubmissionDto,
      status: SubmissionStatus.PENDING,
    });

    const savedSubmission = await this.submissionsRepository.save(submission);

    // TODO: 채점 시스템 연동
    // await this.judgeSubmission(savedSubmission);

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

  // TODO: 채점 시스템 구현
  private async judgeSubmission(submission: Submission): Promise<void> {
    // 1. 코드를 채점 서버로 전송
    // 2. 테스트케이스 실행
    // 3. 결과를 받아서 상태 업데이트
    console.log('채점 시작:', submission.id);
  }
} 