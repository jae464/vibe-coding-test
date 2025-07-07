import { Controller, Post, Body, Param } from '@nestjs/common';
import { JudgeService } from './judge.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@Controller('judge')
export class JudgeController {
  constructor(private readonly judgeService: JudgeService) {}

  @Post('submission/:id')
  async judgeSubmission(@Param('id') id: string) {
    const result = await this.judgeService.judgeSubmission(+id);
    return ApiResponseDto.success(result, '채점이 완료되었습니다.');
  }
} 