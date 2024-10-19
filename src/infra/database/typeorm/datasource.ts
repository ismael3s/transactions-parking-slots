import { DataSource } from 'typeorm';
import { typeormConfig } from './typeorm-config';

export const appDataSource = new DataSource(typeormConfig as any);
