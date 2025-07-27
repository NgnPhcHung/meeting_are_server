import {
  Args,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { RedisService } from '@modules/redis/redis.service';
import { PlaygroundService } from '../services/playground.service';
import { Player } from '../models/playground.model';
import { Logged } from 'decologger';

export enum PlaygroundAction {
  USER_JOINED = 'USER_JOINED',
  USER_MOVED = 'USER_MOVED',
  USER_DISCONNECTED = 'USER_DISCONNECTED',
}

@Resolver(() => Player)
export class PlaygroundResolver {
  constructor(
    @Inject('PUB_SUB') private pubSub: PubSub,
    private redisService: RedisService,
    private playgroundService: PlaygroundService,
  ) {}

  @Query(() => [Player], { nullable: 'itemsAndList' })
  async players(@Args('roomName') roomName: string): Promise<Player[]> {
    const players = await this.redisService.getList<Player>(roomName);
    return players || [];
  }

  @Mutation(() => Player)
  @Logged({
    formatter: (data) => `Execute [${data.methodName}] with ${data.params}`,
  })
  async userJoinPlayground(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('roomName') roomName: string,
  ): Promise<Player> {
    const existedUser = await this.redisService.getHashKey<Player>(
      roomName,
      userId.toString(),
    );

    if (existedUser) {
      await this.pubSub.publish(PlaygroundAction.USER_JOINED, {
        userJoined: existedUser,
      });
      return existedUser;
    }

    const newPlayer = {
      userId,
      avatarImg: await this.playgroundService.generateRandomAvatar(),
      position: { x: 100, y: 100 },
    };

    await this.redisService.pushToList(roomName, newPlayer);
    await this.pubSub.publish(PlaygroundAction.USER_JOINED, {
      userJoined: newPlayer,
    });
    return newPlayer;
  }

  @Subscription(() => Player)
  @Logged({
    formatter: (data) => `Execute [${data.methodName}] with ${data.params}`,
  })
  userJoined() {
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_JOINED);
  }

  @Subscription(() => Player)
  userMoved() {
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_MOVED);
  }

  @Subscription(() => Player)
  @Logged({
    formatter: (data) => `Execute [${data.methodName}] with ${data.params}`,
  })
  userDisconnected() {
    return this.pubSub.asyncIterableIterator(
      PlaygroundAction.USER_DISCONNECTED,
    );
  }

  async updatePlayerPositionDirectly(
    userId: number,
    x: number,
    y: number,
    roomName: string,
  ) {
    const player = await this.redisService.getHashKey<Player>(
      roomName,
      userId.toString(),
    );
    if (!player) {
      throw new Error(`Player with userId ${userId} not found`);
    }
    const updatedPlayer = { ...player, position: { x, y } };
    await this.redisService.pushToList(roomName, updatedPlayer);
    await this.pubSub.publish(PlaygroundAction.USER_MOVED, {
      userMoved: updatedPlayer,
    });
    return updatedPlayer;
  }
}
