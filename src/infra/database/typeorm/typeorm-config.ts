import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from './snake-case-strategy';

export const typeormConfig = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'root',
  database: process.env.DATABASE_NAME || 'parking-slot',
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  entities: [__dirname + '/../../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../../**/migrations/*{.ts,.js}'],
  logging: false,
};
