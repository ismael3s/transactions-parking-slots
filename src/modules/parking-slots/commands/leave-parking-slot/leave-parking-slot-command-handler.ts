import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ParkingSlotRepository,
  ParkingSlotReservationRepository,
} from '../../repositories/parking-slot.repository';
import { OutboxRepository } from 'src/modules/shared/outbox/repositories/outbox.repository';
import { Outbox } from 'src/modules/shared/outbox/entities/outbox.entity';
import { LeaveParkingSlotCommand } from './leave-parking-slot-command';
import { Transactional } from '@nestjs-cls/transactional';
import { TimerGateway } from 'src/modules/shared/timers/timer.gateway';

@CommandHandler(LeaveParkingSlotCommand)
export class LeaveParkingSlotCommandHandler
  implements ICommandHandler<LeaveParkingSlotCommand>
{
  constructor(
    private readonly parkingSlotRepository: ParkingSlotRepository,
    private readonly parkingSlotReservationRepository: ParkingSlotReservationRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly timerGateway: TimerGateway,
  ) {}

  @Transactional()
  async execute(command: LeaveParkingSlotCommand): Promise<any> {
    const parkingSlot = await this.parkingSlotRepository.findById(
      command.parkingSlotId,
    );
    if (!parkingSlot) throw new Error('Parking slot not found');
    const reservation =
      await this.parkingSlotReservationRepository.findLastByPlateAndParkingSlotId(
        command.plate,
        parkingSlot.id,
      );
    if (!reservation) throw new Error('Parking slot is not reserved');
    parkingSlot.leave();
    reservation.leftAt = this.timerGateway.now();
    const outbox = Outbox.fromEvent('Reservation.Left', {
      parkingSlotId: parkingSlot.id,
      reservationId: reservation.id,
    });
    await this.parkingSlotRepository.save(parkingSlot);
    await this.parkingSlotReservationRepository.save(reservation);
    await this.outboxRepository.save(outbox);
  }
}
