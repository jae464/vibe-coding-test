import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../../entities/ChatMessage';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { RoomGateway } from '../../websocket/room.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessagesRepository: Repository<ChatMessage>,
    private roomGateway: RoomGateway,
  ) {}

  async create(createChatMessageDto: CreateChatMessageDto): Promise<ChatMessage> {
    const chatMessage = this.chatMessagesRepository.create(createChatMessageDto);
    const savedMessage = await this.chatMessagesRepository.save(chatMessage);

    // WebSocket을 통해 실시간으로 메시지 브로드캐스트
    // TODO: 사용자 정보를 가져와서 username 전달
    await this.roomGateway.broadcastChatMessage(
      createChatMessageDto.roomId,
      createChatMessageDto.userId,
      'Unknown User',
      createChatMessageDto.message,
    );

    return savedMessage;
  }

  async findByRoom(roomId: number): Promise<ChatMessage[]> {
    return this.chatMessagesRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findRecentByRoom(roomId: number, limit: number = 50): Promise<ChatMessage[]> {
    return this.chatMessagesRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
} 