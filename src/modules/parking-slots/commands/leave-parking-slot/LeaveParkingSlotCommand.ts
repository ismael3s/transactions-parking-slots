export class LeaveParkingSlotCommand {
  constructor(
    public readonly parkingSlotId: string,
    public readonly plate: string,
  ) {}
}
