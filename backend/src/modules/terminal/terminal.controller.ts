import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  TerminalService,
  TerminalSession,
  TerminalCommand,
} from "./terminal.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiResponseDto } from "../../common/dto/api-response.dto";

@Controller("terminal")
@UseGuards(JwtAuthGuard)
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) {}

  @Post("sessions")
  async createSession(@Request() req, @Body() body: { language?: string }) {
    try {
      const session = await this.terminalService.createSession(
        req.user.id,
        body.language || "bash"
      );
      return ApiResponseDto.success(
        session,
        "터미널 세션이 성공적으로 생성되었습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Get("sessions")
  async getSessions(@Request() req) {
    try {
      const sessions = await this.terminalService.getSessionsByUser(
        req.user.id
      );
      return ApiResponseDto.success(
        sessions,
        "터미널 세션 목록을 성공적으로 조회했습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Get("sessions/:sessionId")
  async getSession(@Param("sessionId") sessionId: string) {
    try {
      const session = await this.terminalService.getSession(sessionId);
      if (!session) {
        return ApiResponseDto.error("세션을 찾을 수 없습니다.");
      }
      return ApiResponseDto.success(
        session,
        "터미널 세션을 성공적으로 조회했습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Post("sessions/:sessionId/execute")
  async executeCommand(
    @Param("sessionId") sessionId: string,
    @Body() body: { command: string }
  ) {
    try {
      const result = await this.terminalService.executeCommand(
        sessionId,
        body.command
      );
      return ApiResponseDto.success(
        result,
        "명령어가 성공적으로 실행되었습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Post("sessions/:sessionId/files")
  async createFile(
    @Param("sessionId") sessionId: string,
    @Body() body: { filename: string; content: string }
  ) {
    try {
      await this.terminalService.createFile(
        sessionId,
        body.filename,
        body.content
      );
      return ApiResponseDto.success(null, "파일이 성공적으로 생성되었습니다.");
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Get("sessions/:sessionId/files/:filename")
  async readFile(
    @Param("sessionId") sessionId: string,
    @Param("filename") filename: string
  ) {
    try {
      const content = await this.terminalService.readFile(sessionId, filename);
      return ApiResponseDto.success(
        { content },
        "파일을 성공적으로 읽었습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Delete("sessions/:sessionId")
  async destroySession(@Param("sessionId") sessionId: string) {
    try {
      await this.terminalService.destroySession(sessionId);
      return ApiResponseDto.success(
        null,
        "터미널 세션이 성공적으로 종료되었습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Delete("sessions")
  async destroyUserSessions(@Request() req) {
    try {
      await this.terminalService.destroyUserSessions(req.user.id);
      return ApiResponseDto.success(
        null,
        "모든 터미널 세션이 성공적으로 종료되었습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Post("sessions/:sessionId/run")
  async runCode(
    @Param("sessionId") sessionId: string,
    @Body() body: { language: string; filename: string; code: string }
  ) {
    try {
      const result = await this.terminalService.runCode(
        sessionId,
        body.language,
        body.filename,
        body.code
      );
      return ApiResponseDto.success(
        result,
        "코드가 성공적으로 실행되었습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Get("languages")
  async getSupportedLanguages() {
    try {
      const languages = this.terminalService.getSupportedLanguages();
      return ApiResponseDto.success(
        languages,
        "지원하는 언어 목록을 성공적으로 조회했습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }

  @Get("system/info")
  async getSystemInfo() {
    try {
      const info = await this.terminalService.getSystemInfo();
      return ApiResponseDto.success(
        info,
        "시스템 정보를 성공적으로 조회했습니다."
      );
    } catch (error) {
      return ApiResponseDto.error(error.message);
    }
  }
}
