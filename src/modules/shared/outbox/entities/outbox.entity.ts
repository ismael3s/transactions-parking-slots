import { randomUUID } from 'crypto';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Outbox {
  @PrimaryColumn()
  id: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  processedAt?: Date;

  @Column({
    type: 'jsonb',
  })
  payload: any;

  @Column()
  event: string;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  private constructor() {}

  static fromEvent(event: string, payload: any) {
    const outbox = new Outbox();
    outbox.id = randomUUID();
    outbox.event = event;
    outbox.payload = payload;
    outbox.createdAt = new Date();
    return outbox;
  }
}
