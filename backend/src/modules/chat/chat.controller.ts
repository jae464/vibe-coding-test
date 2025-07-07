import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async create(@Body() createChatMessageDto: CreateChatMessageDto) {
    const chatMessage = await this.chatService.create(createChatMessageDto);
    return ApiResponseDto.success(chatMessage, '채팅 메시지가 성공적으로 전송되었습니다.');
  }

  @Get('room/:roomId')
  async findByRoom(@Param('roomId') roomId: string) {
    const messages = await this.chatService.findByRoom(+roomId);
    return ApiResponseDto.success(messages, '방의 채팅 메시지를 성공적으로 조회했습니다.');
  }

  @Get('room/:roomId/recent')
  async findRecentByRoom(@Param('roomId') roomId: string) {
    const messages = await this.chatService.findRecentByRoom(+roomId);
    return ApiResponseDto.success(messages, '방의 최근 채팅 메시지를 성공적으로 조회했습니다.');
  }
} 