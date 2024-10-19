export class ReserveParkingSlotCommand {
  constructor(
    public readonly plate: string,
    public readonly parkingSlotId: string,
  ) {}
}
