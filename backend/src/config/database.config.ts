import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Contest, Room, RoomUser, Problem, Submission, Testcase, ChatMessage } from '../entities';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'algorithm_contest',
  entities: [User, Contest, Room, RoomUser, Problem, Submission, Testcase, ChatMessage],
  synchronize: process.env.NODE_ENV !== 'production', // 개발 환경에서만 true
  logging: process.env.NODE_ENV !== 'production',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}; 