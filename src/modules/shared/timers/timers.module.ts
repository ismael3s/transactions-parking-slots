import { Module } from '@nestjs/common';
import { TimerGateway } from './timer.gateway';

@Module({
  providers: [TimerGateway],
  exports: [TimerGateway],
})
export class TimersModule {}
