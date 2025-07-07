import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ApiResponseDto } from "../../common/dto/api-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async signup(@Body() registerDto: RegisterDto) {
    const result = await this.authService.signup(registerDto);
    return ApiResponseDto.success(
      result,
      "회원가입이 성공적으로 완료되었습니다."
    );
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ApiResponseDto.success(
      result,
      "로그인이 성공적으로 완료되었습니다."
    );
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Request() req) {
    const result = await this.authService.me(req.user.sub);
    return ApiResponseDto.success(
      result,
      "사용자 정보를 성공적으로 조회했습니다."
    );
  }
}
