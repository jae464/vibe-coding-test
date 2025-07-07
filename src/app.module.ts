import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { ContestsModule } from './modules/contests/contests.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ChatModule } from './modules/chat/chat.module';
import { JudgeModule } from './modules/judge/judge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    UsersModule,
    ContestsModule,
    RoomsModule,
    ProblemsModule,
    SubmissionsModule,
    AuthModule,
    WebsocketModule,
    ChatModule,
    JudgeModule,
  ],
})
export class AppModule {} 