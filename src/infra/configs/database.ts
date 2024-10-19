import { registerAs } from '@nestjs/config';
import { typeormConfig } from '../database/typeorm/typeorm-config';

const databaseConfig = registerAs('database', () => typeormConfig);

export { databaseConfig };
