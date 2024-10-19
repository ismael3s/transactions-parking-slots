import { TransactionHost } from '@nestjs-cls/transactional';
import { Test, TestingModule } from '@nestjs/testing';
import { AutoRollBackTransactionalAdapterTypeOrm } from 'src/infra/database/typeorm/transactional-adapter';
import { IntegrationTestHelpers } from 'src/modules/shared/test-helpers/integration/setup-test-container';
import {
  ParkingSlotRepository,
  ParkingSlotReservationRepository,
} from '../../repositories/parking-slot.repository';
import { ReserveParkingSlotCommand } from './reserve-parking-slot-command';
import { ReserveParkingSlotCommandHandler } from './reserve-parking-slot-command-handler';

describe('ReserveParkingSlotCommandHandler - Integration', () => {
  let handler: ReserveParkingSlotCommandHandler;
  let testingModule: TestingModule;
  IntegrationTestHelpers.setupTestContainer();

  let txHost: TransactionHost<AutoRollBackTransactionalAdapterTypeOrm>;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      imports: [...IntegrationTestHelpers.registerDefaultModules()],
      providers: [
        ReserveParkingSlotCommandHandler,
        ParkingSlotRepository,
        ParkingSlotReservationRepository,
      ],
    }).compile();
    handler = await mod.resolve(ReserveParkingSlotCommandHandler);
    txHost = mod.get(TransactionHost);
    testingModule = mod;
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('When a parking slot is available, then should be able to reserve it', async () => {
    await txHost.withTransaction(async () => {
      await handler.execute(
        new ReserveParkingSlotCommand(
          'a-123',
          '7b60fb62-222d-4d92-9a58-c33f94235306',
        ),
      );

      const reservations = await txHost.tx.query(
        'SELECT * FROM parking_slot_reservation',
        [],
      );
      expect(reservations.length).toBe(1);
    });
  });

  it('When a parking slot is not available, then should throw an exception', async () => {
    await txHost.withTransaction(async () => {
      await handler.execute(
        new ReserveParkingSlotCommand(
          'a-123',
          '7b60fb62-222d-4d92-9a58-c33f94235306',
        ),
      );

      await expect(
        handler.execute(
          new ReserveParkingSlotCommand(
            'a-123',
            '7b60fb62-222d-4d92-9a58-c33f94235306',
          ),
        ),
      ).rejects.toThrow('Parking slot is occupied');
    });
  });
});
