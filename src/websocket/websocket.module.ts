import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';

@Module({
  providers: [RoomGateway],
  exports: [RoomGateway],
})
export class WebsocketModule {} 