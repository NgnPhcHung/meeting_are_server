import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserResolver } from './resolver/user.resolver';
import { AppRedisModule } from '@modules/redis/redis.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { PubSub } from 'graphql-subscriptions';

@Module({
  imports: [PrismaModule],
  providers: [
    UserService,
    UserResolver,
    AppRedisModule,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [UserService],
})
export class UserModule {}
