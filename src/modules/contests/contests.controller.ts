import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ContestsService } from './contests.service';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@Controller('contests')
export class ContestsController {
  constructor(private readonly contestsService: ContestsService) {}

  @Post()
  async create(@Body() createContestDto: CreateContestDto) {
    const contest = await this.contestsService.create(createContestDto);
    return ApiResponseDto.success(contest, '대회가 성공적으로 생성되었습니다.');
  }

  @Get()
  async findAll() {
    const contests = await this.contestsService.findAll();
    return ApiResponseDto.success(contests, '대회 목록을 성공적으로 조회했습니다.');
  }

  @Get('active')
  async findActiveContests() {
    const contests = await this.contestsService.findActiveContests();
    return ApiResponseDto.success(contests, '진행 중인 대회 목록을 성공적으로 조회했습니다.');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const contest = await this.contestsService.findOne(+id);
    return ApiResponseDto.success(contest, '대회 정보를 성공적으로 조회했습니다.');
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateContestDto: UpdateContestDto) {
    const contest = await this.contestsService.update(+id, updateContestDto);
    return ApiResponseDto.success(contest, '대회 정보가 성공적으로 수정되었습니다.');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.contestsService.remove(+id);
    return ApiResponseDto.success(null, '대회가 성공적으로 삭제되었습니다.');
  }
} 