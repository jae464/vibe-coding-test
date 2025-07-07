import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from '../../entities/Room';
import { RoomUser } from '../../entities/RoomUser';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomUser])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {} 