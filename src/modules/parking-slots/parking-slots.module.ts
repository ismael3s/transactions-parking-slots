import { Module } from '@nestjs/common';
import { ParkingSlotsController } from './parking-slots.controller';
import { CqrsModule } from '@nestjs/cqrs';
import {
  ParkingSlotRepository,
  ParkingSlotReservationRepository,
} from './repositories/parking-slot.repository';
import { QueriesHandlers } from './queries';
import { UseCasesHandlers } from './commands';
import { OutboxModule } from '../shared/outbox/outbox.module';

@Module({
  imports: [CqrsModule, OutboxModule],
  controllers: [ParkingSlotsController],
  providers: [
    ParkingSlotRepository,
    ParkingSlotReservationRepository,
    ...UseCasesHandlers,
    ...QueriesHandlers,
  ],
})
export class ParkingSlotsModule {}
