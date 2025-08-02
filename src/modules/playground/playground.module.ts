import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { RoomService } from './services/room.service';
import { PlaygroundService } from './services/playground.service';
import { PlaygroundResolver } from './resolvers/playground.resolver';
import { RoomResolver } from './resolvers/room.resolver';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { AppRedisModule } from '@modules/redis/redis.module';
import { MailModule } from '@modules/mail/mail.module';

@Module({
  imports: [PrismaModule, AppRedisModule, MailModule],
  providers: [
    PlaygroundResolver,
    RoomResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
    RoomService,
    PlaygroundService,
  ],
  exports: [PlaygroundService, PlaygroundResolver],
})
export class PlaygroundModule {}
