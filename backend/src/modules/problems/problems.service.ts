import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Problem } from "../../entities/Problem";
import { CreateProblemDto } from "./dto/create-problem.dto";

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(Problem)
    private problemsRepository: Repository<Problem>
  ) {}

  async create(createProblemDto: CreateProblemDto): Promise<Problem> {
    const problem = this.problemsRepository.create(createProblemDto);
    return this.problemsRepository.save(problem);
  }

  async findAll(): Promise<Problem[]> {
    return this.problemsRepository.find({
      relations: ["contest", "testcases"],
      order: { id: "ASC" },
    });
  }

  async findOne(id: number): Promise<Problem> {
    const problem = await this.problemsRepository.findOne({
      where: { id },
      relations: ["contest", "testcases"],
    });

    if (!problem) {
      throw new NotFoundException("문제를 찾을 수 없습니다.");
    }

    return problem;
  }

  async findByContest(contestId: number): Promise<Problem[]> {
    return this.problemsRepository.find({
      where: { contestId },
      relations: ["testcases"],
      order: { id: "ASC" },
    });
  }

  async update(
    id: number,
    updateProblemDto: Partial<CreateProblemDto>
  ): Promise<Problem> {
    const problem = await this.findOne(id);
    await this.problemsRepository.update(id, updateProblemDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const problem = await this.findOne(id);
    await this.problemsRepository.remove(problem);
  }
}
