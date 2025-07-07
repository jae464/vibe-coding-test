import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatMessage } from "../../entities/ChatMessage";
import { User } from "../../entities/User";
import { CreateChatMessageDto } from "./dto/create-chat-message.dto";
import { RoomGateway } from "../../websocket/room.gateway";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessagesRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private roomGateway: RoomGateway
  ) {}

  async create(
    createChatMessageDto: CreateChatMessageDto
  ): Promise<ChatMessage> {
    const chatMessage =
      this.chatMessagesRepository.create(createChatMessageDto);
    const savedMessage = await this.chatMessagesRepository.save(chatMessage);

    // 사용자 정보 조회
    const user = await this.usersRepository.findOne({
      where: { id: createChatMessageDto.userId },
    });

    // WebSocket을 통해 실시간으로 메시지 브로드캐스트
    await this.roomGateway.broadcastChatMessage(
      createChatMessageDto.roomId,
      createChatMessageDto.userId,
      user?.username || "Unknown User",
      createChatMessageDto.message
    );

    return savedMessage;
  }

  async findByRoom(roomId: number): Promise<ChatMessage[]> {
    return this.chatMessagesRepository.find({
      where: { roomId },
      relations: ["user"],
      order: { createdAt: "ASC" },
    });
  }

  async findRecentByRoom(
    roomId: number,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    return this.chatMessagesRepository.find({
      where: { roomId },
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}
