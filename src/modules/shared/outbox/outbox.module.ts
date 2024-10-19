import { Module } from '@nestjs/common';
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxService } from './outbox.service';

@Module({
  providers: [OutboxRepository, OutboxService],
  exports: [OutboxRepository],
})
export class OutboxModule {}
