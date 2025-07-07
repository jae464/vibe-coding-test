import { Module } from "@nestjs/common";
import { RoomGateway } from "./room.gateway";
import { TerminalGateway } from "./terminal.gateway";
import { TerminalModule } from "../modules/terminal/terminal.module";
import { AuthModule } from "../modules/auth/auth.module";

@Module({
  imports: [TerminalModule, AuthModule],
  providers: [RoomGateway, TerminalGateway],
  exports: [RoomGateway, TerminalGateway],
})
export class WebsocketModule {}
