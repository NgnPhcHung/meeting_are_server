import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { PlaygroundModule } from '@modules/playground/playground.module';

@Module({
  imports: [PlaygroundModule],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}
