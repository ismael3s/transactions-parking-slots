import { LeaveParkingSlotCommandHandler } from './leave-parking-slot/leave-parking-slot-command-handler';
import { ReserveParkingSlotCommandHandler } from './reserve-parking-slot/reserve-parking-slot-command-handler';

export const UseCasesHandlers = [
  ReserveParkingSlotCommandHandler,
  LeaveParkingSlotCommandHandler,
];
