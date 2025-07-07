import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return ApiResponseDto.success(user, '사용자가 성공적으로 생성되었습니다.');
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return ApiResponseDto.success(users, '사용자 목록을 성공적으로 조회했습니다.');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    return ApiResponseDto.success(user, '사용자 정보를 성공적으로 조회했습니다.');
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(+id, updateUserDto);
    return ApiResponseDto.success(user, '사용자 정보가 성공적으로 수정되었습니다.');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(+id);
    return ApiResponseDto.success(null, '사용자가 성공적으로 삭제되었습니다.');
  }
} 