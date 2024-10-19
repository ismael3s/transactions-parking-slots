import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import { ParkingSlotReservation } from './parking-slot-usage.entity';

@Entity()
export class ParkingSlot {
  @PrimaryColumn()
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  code: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  isOccupied: boolean;

  @OneToMany(
    () => ParkingSlotReservation,
    (usageHistory) => usageHistory.parkingSlot,
  )
  usages: Relation<ParkingSlotReservation>[];

  @CreateDateColumn()
  createdAt: Date;

  makeReservation(plate: string): ParkingSlotReservation {
    if (this.isOccupied) throw new Error('Parking slot is occupied');
    this.isOccupied = true;
    const reservation = ParkingSlotReservation.create(plate, this);
    return reservation;
  }

  leave() {
    if (!this.isOccupied) throw new Error('Parking slot is not occupied');
    this.isOccupied = false;
  }
}
