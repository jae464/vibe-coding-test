import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Problem } from "../../entities/Problem";
import { Testcase } from "../../entities/Testcase";
import { CreateProblemDto } from "./dto/create-problem.dto";

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(Problem)
    private problemsRepository: Repository<Problem>,
    @InjectRepository(Testcase)
    private testcaseRepository: Repository<Testcase>
  ) {}

  async create(createProblemDto: CreateProblemDto): Promise<Problem> {
    const { testcases, ...problemData } = createProblemDto;
    const problem = this.problemsRepository.create(problemData);
    const savedProblem = await this.problemsRepository.save(problem);

    // 테스트케이스 생성
    if (testcases && testcases.length > 0) {
      const testcaseEntities = testcases.map((testcase, index) => {
        return this.testcaseRepository.create({
          ...testcase,
          problemId: savedProblem.id,
          orderIndex: testcase.orderIndex !== undefined ? testcase.orderIndex : index,
          isSample: testcase.isSample || false,
        });
      });
      await this.testcaseRepository.save(testcaseEntities);
    }

    return this.findOne(savedProblem.id);
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
    const { testcases, ...problemData } = updateProblemDto;
    const problem = await this.findOne(id);
    
    // 문제 정보 업데이트
    await this.problemsRepository.update(id, problemData);

    // 테스트케이스 업데이트
    if (testcases !== undefined) {
      // 기존 테스트케이스 삭제
      await this.testcaseRepository.delete({ problemId: id });
      
      // 새 테스트케이스 생성
      if (testcases.length > 0) {
        const testcaseEntities = testcases.map((testcase, index) => {
          return this.testcaseRepository.create({
            ...testcase,
            problemId: id,
            orderIndex: testcase.orderIndex !== undefined ? testcase.orderIndex : index,
            isSample: testcase.isSample || false,
          });
        });
        await this.testcaseRepository.save(testcaseEntities);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const problem = await this.findOne(id);
    await this.problemsRepository.remove(problem);
  }
}
