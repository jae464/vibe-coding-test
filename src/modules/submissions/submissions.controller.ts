import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(@Body() createSubmissionDto: CreateSubmissionDto) {
    const submission = await this.submissionsService.create(createSubmissionDto);
    return ApiResponseDto.success(submission, '코드가 성공적으로 제출되었습니다.');
  }

  @Get()
  async findAll() {
    const submissions = await this.submissionsService.findAll();
    return ApiResponseDto.success(submissions, '제출 목록을 성공적으로 조회했습니다.');
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    const submissions = await this.submissionsService.findByUser(+userId);
    return ApiResponseDto.success(submissions, '사용자별 제출 목록을 성공적으로 조회했습니다.');
  }

  @Get('room/:roomId')
  async findByRoom(@Param('roomId') roomId: string) {
    const submissions = await this.submissionsService.findByRoom(+roomId);
    return ApiResponseDto.success(submissions, '방별 제출 목록을 성공적으로 조회했습니다.');
  }

  @Get('problem/:problemId')
  async findByProblem(@Param('problemId') problemId: string) {
    const submissions = await this.submissionsService.findByProblem(+problemId);
    return ApiResponseDto.success(submissions, '문제별 제출 목록을 성공적으로 조회했습니다.');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const submission = await this.submissionsService.findOne(+id);
    return ApiResponseDto.success(submission, '제출 정보를 성공적으로 조회했습니다.');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.submissionsService.remove(+id);
    return ApiResponseDto.success(null, '제출이 성공적으로 삭제되었습니다.');
  }
} 