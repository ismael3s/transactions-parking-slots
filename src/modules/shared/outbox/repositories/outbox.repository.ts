import { TransactionHost } from '@nestjs-cls/transactional';
import { AutoRollBackTransactionalAdapterTypeOrm } from '../../../../infra/database/typeorm/transactional-adapter';
import { Outbox } from '../entities/outbox.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OutboxRepository {
  constructor(
    private readonly txHost: TransactionHost<AutoRollBackTransactionalAdapterTypeOrm>,
  ) {}

  get repository() {
    return this.txHost.tx.getRepository(Outbox);
  }

  async save(outbox: Outbox | Outbox[]): Promise<void> {
    await this.repository.save(outbox as any);
  }

  findUnprocessedEvents(): Promise<Outbox[]> {
    return this.repository
      .createQueryBuilder('outbox')
      .where('outbox.processedAt IS NULL')
      .setLock('pessimistic_write')
      .take(10)
      .getMany();
  }
}
