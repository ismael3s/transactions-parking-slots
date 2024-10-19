import { CommandHandler, ICommandHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { FindAvailableParkingSlotsQuery } from './find-available-parking-slots-query';

@QueryHandler(FindAvailableParkingSlotsQuery)
export class FindAvailableParkingSlotsQueryHandler
  implements ICommandHandler<FindAvailableParkingSlotsQuery>
{
  constructor(private readonly dataSource: DataSource) {}

  execute(command: any): Promise<any> {
    return this.dataSource.query(
      `SELECT id, code FROM parking_slot WHERE is_occupied = false`,
    );
  }
}
