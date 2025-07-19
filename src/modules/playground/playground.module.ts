import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { RoomSerivice } from './services/room.service';
import { PlaygroundService } from './services/playground.service';
import { PlaygroundResolver } from './resolvers/playground.resolver';
import { RoomResolver } from './resolvers/room.resolver';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { AppRedisModule } from '@modules/redis/redis.module';

@Module({
  imports: [PrismaModule, AppRedisModule],
  providers: [
    PlaygroundResolver,
    // PlaygroundSubscription,
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
