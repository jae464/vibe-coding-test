import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Contest } from '../../entities/Contest';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';

@Injectable()
export class ContestsService {
  constructor(
    @InjectRepository(Contest)
    private contestsRepository: Repository<Contest>,
  ) {}

  async create(createContestDto: CreateContestDto): Promise<Contest> {
    const contest = this.contestsRepository.create({
      ...createContestDto,
      startTime: new Date(createContestDto.startTime),
      endTime: new Date(createContestDto.endTime),
    });

    return this.contestsRepository.save(contest);
  }

  async findAll(): Promise<Contest[]> {
    return this.contestsRepository.find({
      relations: ['problems'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Contest> {
    const contest = await this.contestsRepository.findOne({
      where: { id },
      relations: ['problems', 'rooms'],
    });

    if (!contest) {
      throw new NotFoundException('대회를 찾을 수 없습니다.');
    }

    return contest;
  }

  async update(id: number, updateContestDto: UpdateContestDto): Promise<Contest> {
    const contest = await this.findOne(id);

    const updateData: any = { ...updateContestDto };
    if (updateContestDto.startTime) {
      updateData.startTime = new Date(updateContestDto.startTime);
    }
    if (updateContestDto.endTime) {
      updateData.endTime = new Date(updateContestDto.endTime);
    }

    await this.contestsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const contest = await this.findOne(id);
    await this.contestsRepository.remove(contest);
  }

  async findActiveContests(): Promise<Contest[]> {
    const now = new Date();
    return this.contestsRepository.find({
      where: {
        isActive: true,
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
      relations: ['problems'],
      order: { startTime: 'ASC' },
    });
  }
} 