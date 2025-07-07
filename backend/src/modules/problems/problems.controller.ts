import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ProblemsService } from "./problems.service";
import { CreateProblemDto } from "./dto/create-problem.dto";
import { ApiResponseDto } from "../../common/dto/api-response.dto";

@Controller("problems")
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  async create(@Body() createProblemDto: CreateProblemDto) {
    const problem = await this.problemsService.create(createProblemDto);
    return ApiResponseDto.success(problem, "문제가 성공적으로 생성되었습니다.");
  }

  @Get()
  async findAll(@Query("contestId") contestId?: string) {
    if (contestId) {
      const problems = await this.problemsService.findByContest(+contestId);
      return ApiResponseDto.success(
        problems,
        "대회별 문제 목록을 성공적으로 조회했습니다."
      );
    }
    const problems = await this.problemsService.findAll();
    return ApiResponseDto.success(
      problems,
      "문제 목록을 성공적으로 조회했습니다."
    );
  }

  @Get("contest/:contestId")
  async findByContest(@Param("contestId") contestId: string) {
    const problems = await this.problemsService.findByContest(+contestId);
    return ApiResponseDto.success(
      problems,
      "대회별 문제 목록을 성공적으로 조회했습니다."
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const problem = await this.problemsService.findOne(+id);
    return ApiResponseDto.success(
      problem,
      "문제 정보를 성공적으로 조회했습니다."
    );
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateProblemDto: Partial<CreateProblemDto>
  ) {
    const problem = await this.problemsService.update(+id, updateProblemDto);
    return ApiResponseDto.success(
      problem,
      "문제 정보가 성공적으로 수정되었습니다."
    );
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.problemsService.remove(+id);
    return ApiResponseDto.success(null, "문제가 성공적으로 삭제되었습니다.");
  }
}
