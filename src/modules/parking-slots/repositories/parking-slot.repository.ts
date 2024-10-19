import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { ParkingSlot } from '../entities/parking-slot.entity';
import { ParkingSlotReservation } from '../entities/parking-slot-usage.entity';

@Injectable()
export class ParkingSlotRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  get repository() {
    return this.txHost.tx.getRepository(ParkingSlot);
  }

  async findById(id: string): Promise<ParkingSlot | null> {
    return (
      this.repository
        .createQueryBuilder('parkingSlot')
        .where('id = :id', { id })
        .setLock('pessimistic_write')
        // .setOnLocked('skip_locked')
        .getOne()
    );
  }

  async save(reservation: ParkingSlot): Promise<void> {
    await this.repository.save(reservation);
  }
}

@Injectable()
export class ParkingSlotReservationRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  get repository() {
    return this.txHost.tx.getRepository(ParkingSlotReservation);
  }

  async save(reservation: ParkingSlotReservation): Promise<void> {
    await this.repository.save(reservation);
  }

  async findLastByPlate(plate: string): Promise<ParkingSlotReservation | null> {
    return this.repository
      .createQueryBuilder('reservation')
      .where('plate = :plate', { plate })
      .orderBy('createdAt', 'DESC')
      .getOne();
  }

  async findLastByPlateAndParkingSlotId(
    plate: string,
    parkingSlotId: string,
  ): Promise<ParkingSlotReservation | null> {
    return this.repository
      .createQueryBuilder('reservation')
      .where('reservation.plate = :plate', { plate })
      .andWhere('reservation.parkingSlotId = :parkingSlotId', { parkingSlotId })
      .orderBy('reservation.createdAt', 'DESC')
      .getOne();
  }
}
