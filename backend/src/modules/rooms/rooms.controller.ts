import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { ApiResponseDto } from "../../common/dto/api-response.dto";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomsService.create(createRoomDto);
    return ApiResponseDto.success(room, "방이 성공적으로 생성되었습니다.");
  }

  @Get()
  async findAll(@Query("contestId") contestId?: string) {
    if (contestId) {
      const rooms = await this.roomsService.findByContest(+contestId);
      return ApiResponseDto.success(
        rooms,
        "대회별 방 목록을 성공적으로 조회했습니다."
      );
    }
    const rooms = await this.roomsService.findAllWithConnectedCount();
    return ApiResponseDto.success(rooms, "방 목록을 성공적으로 조회했습니다.");
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const room = await this.roomsService.findOne(+id);
    return ApiResponseDto.success(room, "방 정보를 성공적으로 조회했습니다.");
  }

  @Get(":roomId/participants")
  async getParticipants(@Param("roomId") roomId: string) {
    const participants = await this.roomsService.getParticipants(+roomId);
    return ApiResponseDto.success(
      participants,
      "방 참가자 목록을 성공적으로 조회했습니다."
    );
  }

  @Post(":roomId/join")
  async joinRoom(
    @Param("roomId") roomId: string,
    @Body("userId") userId: number
  ) {
    const joinRoomDto: JoinRoomDto = {
      roomId: +roomId,
      userId: userId,
    };
    const roomUser = await this.roomsService.joinRoom(joinRoomDto);
    return ApiResponseDto.success(roomUser, "방에 성공적으로 참가했습니다.");
  }

  @Post(":roomId/leave")
  async leaveRoom(
    @Param("roomId") roomId: string,
    @Body("userId") userId: number
  ) {
    await this.roomsService.leaveRoom(+roomId, userId);
    return ApiResponseDto.success(null, "방에서 성공적으로 나갔습니다.");
  }

  @Post(":id/code")
  async updateCode(
    @Param("id") id: string,
    @Body("code") code: string,
    @Body("editorId") editorId: number
  ) {
    const room = await this.roomsService.updateCode(+id, code, editorId);
    return ApiResponseDto.success(
      room,
      "코드가 성공적으로 업데이트되었습니다."
    );
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.roomsService.remove(+id);
    return ApiResponseDto.success(null, "방이 성공적으로 삭제되었습니다.");
  }
}
