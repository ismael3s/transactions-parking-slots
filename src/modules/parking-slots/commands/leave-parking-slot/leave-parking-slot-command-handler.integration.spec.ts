import { TransactionHost } from '@nestjs-cls/transactional';
import { Test, TestingModule } from '@nestjs/testing';
import { AutoRollBackTransactionalAdapterTypeOrm } from 'src/infra/database/typeorm/transactional-adapter';
import { IntegrationTestHelpers } from 'src/modules/shared/test-helpers/integration/setup-test-container';
import { TimerGateway } from 'src/modules/shared/timers/timer.gateway';
import {
  ParkingSlotRepository,
  ParkingSlotReservationRepository,
} from '../../repositories/parking-slot.repository';
import { ReserveParkingSlotCommandHandler } from '../reserve-parking-slot/reserve-parking-slot-command-handler';
import { LeaveParkingSlotCommandHandler } from './leave-parking-slot-command-handler';

describe('LeaveParkingSlotCommandHandler - Integration', () => {
  let reserveParkingSlotCommandHandler: ReserveParkingSlotCommandHandler;
  let sut: LeaveParkingSlotCommandHandler;
  let testingModule: TestingModule;

  let txHost: TransactionHost<AutoRollBackTransactionalAdapterTypeOrm>;
  const containers = IntegrationTestHelpers.setupTestContainer();

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      imports: [...IntegrationTestHelpers.registerDefaultModules()],
      providers: [
        LeaveParkingSlotCommandHandler,
        ParkingSlotRepository,
        ParkingSlotReservationRepository,
        ReserveParkingSlotCommandHandler,
        TimerGateway,
      ],
    }).compile();
    sut = await mod.get(LeaveParkingSlotCommandHandler);
    reserveParkingSlotCommandHandler = await mod.get(
      ReserveParkingSlotCommandHandler,
    );
    txHost = mod.get(TransactionHost);
    testingModule = mod;
  });

  afterEach(async () => {
    await testingModule.close();
  });

  test('When the parking slot is reserved and is requested to leave, then should make the parking slot available', async () => {
    const gateway = testingModule.get(TimerGateway);
    const expectedLeftAt = new Date('2021-01-01T00:00:00Z');
    gateway.now = jest.fn(() => new Date('2021-01-01T00:00:00Z'));

    await txHost.withTransaction(async () => {
      const plate = 'ABC-1234';
      const parkingSlotId = '7b60fb62-222d-4d92-9a58-c33f94235301';
      await reserveParkingSlotCommandHandler.execute({
        parkingSlotId,
        plate,
      });

      await sut.execute({
        parkingSlotId,
        plate,
      });

      const [{ is_occupied }] = await txHost.tx.query(
        'SELECT is_occupied FROM parking_slot WHERE id = $1',
        [parkingSlotId],
      );
      expect(is_occupied).toBe(false);
      const [{ left_at }] = await txHost.tx.query(
        'SELECT left_at FROM parking_slot_reservation WHERE plate = $1 and parking_slot_id = $2',
        [plate, parkingSlotId],
      );
      expect(left_at).toEqual(expectedLeftAt);
    });
  });

  test('When the parking slot is not reserved and is requested to leave, then should throw an exception', async () => {
    await txHost.withTransaction(async () => {
      const plate = 'ABC-1234';
      const parkingSlotId = '7b60fb62-222d-4d92-9a58-c33f94235301';

      await expect(
        sut.execute({
          parkingSlotId,
          plate,
        }),
      ).rejects.toThrow('Parking slot is not reserved');

      const [{ is_occupied }] = await txHost.tx.query(
        'SELECT is_occupied FROM parking_slot WHERE id = $1',
        [parkingSlotId],
      );
      expect(is_occupied).toBe(false);
    });
  });
});
