import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatMessage } from "../../entities/ChatMessage";
import { User } from "../../entities/User";
import { WebsocketModule } from "../../websocket/websocket.module";

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, User]), WebsocketModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
