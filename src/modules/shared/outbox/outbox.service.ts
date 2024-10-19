import { Injectable } from '@nestjs/common';
import { OutboxRepository } from './repositories/outbox.repository';
import { Cron } from '@nestjs/schedule';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class OutboxService {
  constructor(private readonly outboxRepository: OutboxRepository) {}

  @Cron('*/10 * * * * *')
  @Transactional()
  async processOutbox() {
    const outboxEvents = await this.outboxRepository.findUnprocessedEvents();
    for (const outboxEvent of outboxEvents) {
      console.log(
        `Processing outbox event - ${outboxEvent.event} ${outboxEvent.id}`,
      );
      outboxEvent.processedAt = new Date();
      await this.outboxRepository.save(outboxEvent);
    }
  }
}
