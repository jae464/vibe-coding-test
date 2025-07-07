import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../entities/Room';
import { RoomUser } from '../../entities/RoomUser';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { RoomGateway } from '../../websocket/room.gateway';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(RoomUser)
    private roomUsersRepository: Repository<RoomUser>,
    private roomGateway: RoomGateway,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomsRepository.create(createRoomDto);
    const savedRoom = await this.roomsRepository.save(room);

    // 방 생성자를 자동으로 참가자로 추가
    await this.joinRoom({
      roomId: savedRoom.id,
      userId: createRoomDto.createdBy,
    });

    return savedRoom;
  }

  async findAll(): Promise<Room[]> {
    return this.roomsRepository.find({
      relations: ['contest', 'creator', 'roomUsers', 'roomUsers.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['contest', 'creator', 'roomUsers', 'roomUsers.user'],
    });

    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다.');
    }

    return room;
  }

  async findByContest(contestId: number): Promise<Room[]> {
    return this.roomsRepository.find({
      where: { contestId },
      relations: ['contest', 'creator', 'roomUsers', 'roomUsers.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async joinRoom(joinRoomDto: JoinRoomDto): Promise<RoomUser> {
    // 이미 참가 중인지 확인
    const existingMember = await this.roomUsersRepository.findOne({
      where: {
        roomId: joinRoomDto.roomId,
        userId: joinRoomDto.userId,
      },
    });

    if (existingMember) {
      throw new ConflictException('이미 참가 중인 방입니다.');
    }

    const roomUser = this.roomUsersRepository.create(joinRoomDto);
    return this.roomUsersRepository.save(roomUser);
  }

  async leaveRoom(roomId: number, userId: number): Promise<void> {
    const roomUser = await this.roomUsersRepository.findOne({
      where: {
        roomId,
        userId,
      },
    });

    if (!roomUser) {
      throw new NotFoundException('참가 중인 방이 아닙니다.');
    }

    await this.roomUsersRepository.remove(roomUser);
  }

  async updateCode(roomId: number, code: string, editorId: number): Promise<void> {
    // WebSocket을 통해 코드 변경을 브로드캐스트
    // TODO: 사용자 정보를 가져와서 editorName 전달
    await this.roomGateway.broadcastCodeChange(roomId, code, editorId, 'Unknown User');
  }

  async sendChatMessage(roomId: number, userId: number, username: string, message: string): Promise<void> {
    // WebSocket을 통해 채팅 메시지를 브로드캐스트
    await this.roomGateway.broadcastChatMessage(roomId, userId, username, message);
  }

  async broadcastSubmissionResult(roomId: number, submissionId: number, problemId: number, status: string, resultMessage?: string): Promise<void> {
    // WebSocket을 통해 제출 결과를 브로드캐스트
    await this.roomGateway.broadcastSubmissionResult(roomId, submissionId, problemId, status, resultMessage);
  }

  async remove(id: number): Promise<void> {
    const room = await this.findOne(id);
    await this.roomsRepository.remove(room);
  }
} 