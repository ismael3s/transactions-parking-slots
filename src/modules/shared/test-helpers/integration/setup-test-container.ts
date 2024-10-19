import { CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';
import { SnakeNamingStrategy } from 'src/infra/database/typeorm/snake-case-strategy';
import { DataSource } from 'typeorm';
import { OutboxModule } from '../../outbox/outbox.module';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { AutoRollBackTransactionalAdapterTypeOrm } from 'src/infra/database/typeorm/transactional-adapter';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';

let container: StartedPostgreSqlContainer;

const migrationsAndEntitiesPath = {
  entities: [__dirname + '/../../../**/*.entity.ts'],
  migrations: [__dirname + '/../../../../../../**/migrations/*.ts'],
};
export class IntegrationTestHelpers {
  static setupTestContainer() {
    beforeAll(async () => {
      container = await new PostgreSqlContainer()
        .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
        .start();
      process.env.DATABASE_HOST = container.getHost();
      process.env.DATABASE_PORT = container.getPort().toString();
      process.env.DATABASE_USER = container.getUsername();
      process.env.DATABASE_PASSWORD = container.getPassword();
      const client = new Client({
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        user: container.getUsername(),
        password: container.getPassword(),
      });
      await client.connect();
      await client.query('CREATE DATABASE "parking-slot"');
      await client.end();

      const app = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: container.getHost(),
            port: container.getPort(),
            username: container.getUsername(),
            password: container.getPassword(),
            database: 'parking-slot',
            namingStrategy: new SnakeNamingStrategy(),
            synchronize: false,
            logging: false,
            ...migrationsAndEntitiesPath,
          }),
        ],
      }).compile();
      const dataSource = app.get(DataSource);
      await dataSource.runMigrations();
      await app.close();
    });

    afterAll(async () => {
      await container.stop();
    });

    return {
      get postgreSqlContainer() {
        return container;
      },
    };
  }

  static registerDefaultModules(
    { configs } = {
      configs: {
        database: {
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: 'parking-slot',
          namingStrategy: new SnakeNamingStrategy(),
          synchronize: false,
          ...migrationsAndEntitiesPath,
          logging: false,
        },
      },
    },
  ) {
    return [
      CqrsModule,
      OutboxModule,
      ClsModule.forRoot({
        global: true,
        middleware: {
          mount: true,
        },
        plugins: [
          new ClsPluginTransactional({
            imports: [TypeOrmModule],
            adapter: new AutoRollBackTransactionalAdapterTypeOrm({
              dataSourceToken: getDataSourceToken(),
            }),
          }),
        ],
      }),
      ConfigModule.forRoot({
        isGlobal: true,
        load: [registerAs('database', () => configs.database)],
      }),
      TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          configService.get('database'),
      }),
    ];
  }
}
