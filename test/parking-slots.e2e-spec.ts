import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { randomUUID } from 'crypto';
import { ClsModule, ClsService } from 'nestjs-cls';
import { Client } from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from '../src/infra/database/typeorm/snake-case-strategy';
import { UseCasesHandlers } from '../src/modules/parking-slots/commands';
import { ReserveParkingSlotCommandHandler } from '../src/modules/parking-slots/commands/reserve-parking-slot/reserve-parking-slot-command-handler';
import { ParkingSlotsController } from '../src/modules/parking-slots/parking-slots.controller';
import { QueriesHandlers } from '../src/modules/parking-slots/queries';
import {
  ParkingSlotRepository,
  ParkingSlotReservationRepository,
} from '../src/modules/parking-slots/repositories/parking-slot.repository';
import { OutboxModule } from '../src/modules/shared/outbox/outbox.module';
import { TimersModule } from 'src/modules/shared/timers/timers.module';
import exp from 'constants';

describe('ParkingSlotsController', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  let client: Client;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
      .start();

    client = new Client({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  beforeEach(async () => {
    const databaseName = `parking-slot_test_${randomUUID()}`;

    await client.query(`CREATE DATABASE "${databaseName}"`);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TimersModule,
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
              adapter: new TransactionalAdapterTypeOrm({
                dataSourceToken: getDataSourceToken(),
              }),
            }),
          ],
        }),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            registerAs('database', () => ({
              type: 'postgres',
              host: container.getHost(),
              port: container.getPort(),
              username: container.getUsername(),
              password: container.getPassword(),
              database: databaseName,
              namingStrategy: new SnakeNamingStrategy(),
              synchronize: false,
              entities: [__dirname + '/../**/*.entity.ts'],
              migrations: [__dirname + '/../**/migrations/*.ts'],
              logging: false,
            })),
          ],
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            configService.get('database'),
        }),
      ],
      controllers: [ParkingSlotsController],
      providers: [
        ParkingSlotRepository,
        ParkingSlotReservationRepository,
        ...UseCasesHandlers,
        ...QueriesHandlers,
        {
          provide: ReserveParkingSlotCommandHandler,
          useClass: ReserveParkingSlotCommandHandler,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    const dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/parking-slots/available (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/parking-slots/availables')
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'A1',
        }),
        expect.objectContaining({
          code: 'A2',
        }),
        expect.objectContaining({
          code: 'A3',
        }),
      ]),
    );
  });

  describe('/parking-slots/:id/reserve (POST)', () => {
    test('Should be able to reserve a parking slot', async () => {
      const response = await request(app.getHttpServer())
        .get('/parking-slots/availables')
        .expect(200);

      const parkingSlot = response.body[0].id;
      await request(app.getHttpServer())
        .post(`/parking-slots/${parkingSlot}/reserve`)
        .send({
          plate: 'ABC-1234',
        })
        .expect(204);
    });

    test('When a concurrent requests to parking slot is made, only, one of it can returns OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/parking-slots/availables')
        .expect(200);

      const parkingSlot = response.body[0].id;

      const [firstResponse, secondResponse] = await Promise.all([
        request(app.getHttpServer())
          .post(`/parking-slots/${parkingSlot}/reserve`)
          .send({
            plate: 'ABC-1234',
          }),
        request(app.getHttpServer())
          .post(`/parking-slots/${parkingSlot}/reserve`)
          .send({
            plate: 'ABC-1235',
          }),
      ]);
      expect(firstResponse.status).toBe(204);
      expect(secondResponse.status).toBe(500); // handle error
    });
  });

  describe('/parking-slots/:id/leave/:plate (PATCH)', () => {
    test('Should be able to reserve a parking slot, and leave after use it', async () => {
      const response = await request(app.getHttpServer())
        .get('/parking-slots/availables')
        .expect(200);
      const plate = 'ABC-1234';

      const parkingSlot = response.body[0].id;
      await request(app.getHttpServer())
        .post(`/parking-slots/${parkingSlot}/reserve`)
        .send({
          plate,
        })
        .expect(204);

      await request(app.getHttpServer())
        .patch(`/parking-slots/${parkingSlot}/leave/${plate}`)
        .expect(204);

      const datasource = app.get(DataSource);

      const [{ left_at }] = await datasource.query(
        `SELECT left_at FROM parking_slot_reservation WHERE plate = $1 and parking_slot_id = $2`,
        [plate, parkingSlot],
      );
      expect(left_at).not.toBeNull();
    });
  });
});
