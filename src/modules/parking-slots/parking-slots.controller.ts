import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { CreateParkingSlotDto } from './dto/create-parking-slot.dto';
import { UpdateParkingSlotDto } from './dto/update-parking-slot.dto';
import { ReserveParkingSlotDto } from './dto/reserve-parking-slot';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ReserveParkingSlotCommand } from './commands/reserve-parking-slot/reserve-parking-slot-command';
import { FindAvailableParkingSlotsQuery } from './queries/find-available-parking-slots/find-available-parking-slots-query';
import { LeaveParkingSlotCommand } from './commands/leave-parking-slot/leave-parking-slot-command';

@Controller('parking-slots')
export class ParkingSlotsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@Body() createParkingSlotDto: CreateParkingSlotDto) {}

  @Post(':id/reserve')
  @HttpCode(204)
  async reserve(
    @Body()
    input: ReserveParkingSlotDto,
    @Param('id')
    parkingSlotId: string,
  ) {
    await this.commandBus.execute(
      new ReserveParkingSlotCommand(input.plate, parkingSlotId),
    );
  }

  @Patch(':id/leave/:plate')
  @HttpCode(204)
  async leave(
    @Param('id')
    parkingSlotId: string,
    @Param('plate')
    plate: string,
  ) {
    await this.commandBus.execute(
      new LeaveParkingSlotCommand(parkingSlotId, plate),
    );
  }

  @Get('availables')
  findAll() {
    return this.queryBus.execute(new FindAvailableParkingSlotsQuery());
  }
}
