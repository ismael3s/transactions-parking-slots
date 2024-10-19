import { Transactional } from '@nestjs-cls/transactional';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Outbox } from '../../../shared/outbox/entities/outbox.entity';
import { OutboxRepository } from '../../../shared/outbox/repositories/outbox.repository';
import {
  ParkingSlotRepository,
  ParkingSlotReservationRepository,
} from '../../repositories/parking-slot.repository';
import { ReserveParkingSlotCommand } from './reserve-parking-slot-command';

@CommandHandler(ReserveParkingSlotCommand)
export class ReserveParkingSlotCommandHandler
  implements ICommandHandler<ReserveParkingSlotCommand>
{
  constructor(
    private readonly parkingSlotRepository: ParkingSlotRepository,
    private readonly parkingSlotReservationRepository: ParkingSlotReservationRepository,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  @Transactional()
  async execute(command: ReserveParkingSlotCommand): Promise<any> {
    const parkingSlot = await this.parkingSlotRepository.findById(
      command.parkingSlotId,
    );
    if (!parkingSlot) throw new Error('Parking slot not found');
    if (parkingSlot.isOccupied) throw new Error('Parking slot is occupied');
    const reservation = parkingSlot.makeReservation(command.plate);
    const outbox = Outbox.fromEvent('Reservation.Created', {
      parkingSlotId: parkingSlot.id,
      plate: command.plate,
      reservationId: reservation.id,
    });
    await this.parkingSlotRepository.save(parkingSlot);
    await this.parkingSlotReservationRepository.save(reservation);
    await this.outboxRepository.save(outbox);
  }
}
