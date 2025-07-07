import { Module } from "@nestjs/common";
import { TerminalService } from "./terminal.service";
import { TerminalController } from "./terminal.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [TerminalController],
  providers: [TerminalService],
  exports: [TerminalService],
})
export class TerminalModule {}
