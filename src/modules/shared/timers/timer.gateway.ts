import { Injectable } from '@nestjs/common';
import { ITimerGateway } from './timer.interface';

@Injectable()
export class TimerGateway implements ITimerGateway {
  now() {
    return new Date();
  }
}
