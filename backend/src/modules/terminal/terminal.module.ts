import { Module } from "@nestjs/common";
import { TerminalService } from "./terminal.service";
import { TerminalController } from "./terminal.controller";
import { DockerImageService } from "./docker-image.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [TerminalController],
  providers: [TerminalService, DockerImageService],
  exports: [TerminalService, DockerImageService],
})
export class TerminalModule {}
