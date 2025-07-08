import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Room } from "../../entities/Room";
import { RoomUser } from "../../entities/RoomUser";
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { RoomGateway } from "../../websocket/room.gateway";

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(RoomUser)
    private roomUsersRepository: Repository<RoomUser>,
    private roomGateway: RoomGateway
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomsRepository.create(createRoomDto);
    const savedRoom = await this.roomsRepository.save(room);

    // 방 생성자는 자동으로 참가하지 않음 (사용자가 직접 참가해야 함)
    return savedRoom;
  }

  async findAll(): Promise<Room[]> {
    const rooms = await this.roomsRepository.find({
      relations: [
        "contest",
        "creator",
        "roomUsers",
        "roomUsers.user",
        "problem",
      ],
      order: { createdAt: "DESC" },
    });

    // 각 방의 참가자 수를 계산하여 추가
    for (const room of rooms) {
      room["participantCount"] = room.roomUsers?.length || 0;
    }

    return rooms;
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: [
        "contest",
        "creator",
        "roomUsers",
        "roomUsers.user",
        "problem",
      ],
    });

    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다.");
    }

    // 참가자 수를 계산하여 추가
    room["participantCount"] = room.roomUsers?.length || 0;

    return room;
  }

  async findByContest(contestId: number): Promise<Room[]> {
    const rooms = await this.roomsRepository.find({
      where: { contestId },
      relations: [
        "contest",
        "creator",
        "roomUsers",
        "roomUsers.user",
        "problem",
      ],
      order: { createdAt: "DESC" },
    });

    // 각 방의 참가자 수를 계산하여 추가
    for (const room of rooms) {
      room["participantCount"] = room.roomUsers?.length || 0;
    }

    return rooms;
  }

  async joinRoom(joinRoomDto: JoinRoomDto): Promise<RoomUser> {
    console.log(
      `[RoomsService] 방 참가 시도: roomId=${joinRoomDto.roomId}, userId=${joinRoomDto.userId}`
    );

    // 이미 참가 중인지 확인
    const existingMember = await this.roomUsersRepository.findOne({
      where: {
        roomId: joinRoomDto.roomId,
        userId: joinRoomDto.userId,
      },
    });

    if (existingMember) {
      console.log(
        `[RoomsService] 이미 참가 중: roomId=${joinRoomDto.roomId}, userId=${joinRoomDto.userId}`
      );
      throw new ConflictException("이미 참가 중인 방입니다.");
    }

    const roomUser = this.roomUsersRepository.create(joinRoomDto);
    const savedRoomUser = await this.roomUsersRepository.save(roomUser);
    console.log(
      `[RoomsService] 방 참가 성공: roomId=${joinRoomDto.roomId}, userId=${joinRoomDto.userId}`
    );

    // WebSocket 연결 상태 기반으로 참가자 수 계산
    const connectedParticipants = await this.getConnectedParticipants(
      joinRoomDto.roomId
    );
    console.log(
      `[RoomsService] WebSocket 연결된 참가자 수: ${connectedParticipants}`
    );

    // 방 업데이트를 WebSocket을 통해 브로드캐스트
    await this.roomGateway.broadcastRoomUpdate(joinRoomDto.roomId, {
      roomId: joinRoomDto.roomId,
      participantCount: connectedParticipants,
      participants: [], // WebSocket에서 실제 참가자 목록을 관리
    });

    return savedRoomUser;
  }

  async leaveRoom(roomId: number, userId: number): Promise<void> {
    console.log(
      `[RoomsService] 방 퇴장 시도: roomId=${roomId}, userId=${userId}`
    );

    const roomUser = await this.roomUsersRepository.findOne({
      where: {
        roomId,
        userId,
      },
    });

    if (!roomUser) {
      console.log(
        `[RoomsService] 참가 중인 방이 아님: roomId=${roomId}, userId=${userId}`
      );
      throw new NotFoundException("참가 중인 방이 아닙니다.");
    }

    await this.roomUsersRepository.remove(roomUser);
    console.log(
      `[RoomsService] 방 퇴장 성공: roomId=${roomId}, userId=${userId}`
    );

    // WebSocket 연결 상태 기반으로 참가자 수 계산
    const connectedParticipants = await this.getConnectedParticipants(roomId);
    console.log(
      `[RoomsService] WebSocket 연결된 참가자 수: ${connectedParticipants}`
    );

    // 방 업데이트를 WebSocket을 통해 브로드캐스트
    await this.roomGateway.broadcastRoomUpdate(roomId, {
      roomId: roomId,
      participantCount: connectedParticipants,
      participants: [], // WebSocket에서 실제 참가자 목록을 관리
    });
  }

  async updateCode(
    roomId: number,
    code: string,
    editorId: number
  ): Promise<void> {
    // WebSocket을 통해 코드 변경을 브로드캐스트
    // TODO: 사용자 정보를 가져와서 editorName 전달
    await this.roomGateway.broadcastCodeChange(
      roomId,
      code,
      editorId,
      "Unknown User"
    );
  }

  async sendChatMessage(
    roomId: number,
    userId: number,
    username: string,
    message: string
  ): Promise<void> {
    // WebSocket을 통해 채팅 메시지를 브로드캐스트
    await this.roomGateway.broadcastChatMessage(
      roomId,
      userId,
      username,
      message
    );
  }

  async broadcastSubmissionResult(
    roomId: number,
    submissionId: number,
    problemId: number,
    status: string,
    resultMessage?: string
  ): Promise<void> {
    // WebSocket을 통해 제출 결과를 브로드캐스트
    await this.roomGateway.broadcastSubmissionResult(
      roomId,
      submissionId,
      problemId,
      status,
      resultMessage
    );
  }

  async remove(id: number): Promise<void> {
    const room = await this.findOne(id);
    await this.roomsRepository.remove(room);
  }

  async getParticipants(roomId: number): Promise<RoomUser[]> {
    return this.roomUsersRepository.find({
      where: { roomId },
      relations: ["user"],
      order: { joinedAt: "ASC" },
    });
  }

  // WebSocket 연결 상태를 기반으로 참가자 수 가져오기
  async getConnectedParticipants(roomId: number): Promise<number> {
    // WebSocket Gateway에서 연결된 사용자 수를 가져옴
    const connectedUsers = this.roomGateway.getConnectedUsers();
    const roomParticipants = Array.from(connectedUsers.values()).filter(
      (user) => user.roomId === roomId
    );
    return roomParticipants.length;
  }

  // 방 목록 조회 시 WebSocket 연결 상태 기반 참가자 수 포함
  async findAllWithConnectedCount(): Promise<Room[]> {
    const rooms = await this.roomsRepository.find({
      relations: [
        "contest",
        "creator",
        "roomUsers",
        "roomUsers.user",
        "problem",
      ],
      order: { createdAt: "DESC" },
    });

    // 각 방의 실제 연결된 참가자 수를 계산하여 추가
    for (const room of rooms) {
      room["participantCount"] = await this.getConnectedParticipants(room.id);
    }

    return rooms;
  }
}
