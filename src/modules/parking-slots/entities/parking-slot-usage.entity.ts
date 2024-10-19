import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Relation,
} from 'typeorm';
import { ParkingSlot } from './parking-slot.entity';
import { randomUUID } from 'crypto';

@Entity()
@Index(['plate'])
export class ParkingSlotReservation {
  @PrimaryColumn()
  id: string;

  @Column()
  plate: string;

  @Column()
  parkingSlotId: string;

  @ManyToOne(() => ParkingSlot, (parkingSlot) => parkingSlot.id)
  parkingSlot: Relation<ParkingSlot>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  leftAt: Date;

  static create(
    plate: string,
    parkingSlot: ParkingSlot,
  ): ParkingSlotReservation {
    const usage = new ParkingSlotReservation();
    usage.id = randomUUID();
    usage.plate = plate;
    usage.parkingSlotId = parkingSlot.id;
    usage.parkingSlot = parkingSlot;
    return usage;
  }
}
