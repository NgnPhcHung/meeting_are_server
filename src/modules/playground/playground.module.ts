import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { RoomSerivice } from './services/room.service';
import { PlaygroundService } from './services/playground.service';
import { PlaygroundResolver } from './resolvers/playground.resolver';
import { RoomResolver } from './resolvers/room.resolver';
import { PlaygroundSubscription } from './subscriptions/playground.subscription';
import { PrismaModule } from '@modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    PlaygroundResolver,
    PlaygroundSubscription,
    RoomResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
    RoomSerivice,
    PlaygroundService,
  ],
  exports: [],
})
export class PlaygroundModule {}
