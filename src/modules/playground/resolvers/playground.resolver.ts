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
import { Player } from '../dtos/playground.model';
import { PlaygroundService } from '../services/playground.service';

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
  async players(): Promise<Player[]> {
    const players = await this.redisService.getList<Player>('new_room');
    console.log('Players query:', players);
    return players || [];
  }

  @Mutation(() => Player)
  async userJoinPlayground(
    @Args('userId', { type: () => Int }) userId: number,
  ): Promise<Player> {
    console.log('userJoinPlayground called with userId:', userId);
    const existedUser = await this.redisService.getHashKey<Player>(
      'new_room',
      userId.toString(),
    );
    console.log('Existing user:', existedUser);

    if (existedUser) {
      await this.pubSub.publish(PlaygroundAction.USER_JOINED, {
        userJoined: existedUser,
      });
      console.log('Published USER_JOINED for existing user:', existedUser);
      return existedUser;
    }

    const newPlayer = {
      userId,
      avatarImg: await this.playgroundService.generateRandomAvatar(),
      position: { x: 100, y: 100 },
    };

    await this.redisService.pushToList('new_room', newPlayer);
    await this.pubSub.publish(PlaygroundAction.USER_JOINED, {
      userJoined: newPlayer,
    });
    console.log('Published USER_JOINED for new player:', newPlayer);
    return newPlayer;
  }

  @Subscription(() => Player)
  userJoined() {
    console.log('Client subscribed to userJoined');
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_JOINED);
  }

  @Subscription(() => Player)
  userMoved() {
    console.log('Client subscribed to userMoved');
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_MOVED);
  }

  @Subscription(() => Player)
  userDisconnected() {
    console.log('Client subscribed to userDisconnected');
    return this.pubSub.asyncIterableIterator(
      PlaygroundAction.USER_DISCONNECTED,
    );
  }

  async updatePlayerPositionDirectly(userId: number, x: number, y: number) {
    console.log('updatePlayerPositionDirectly called with:', { userId, x, y });
    const player = await this.redisService.getHashKey<Player>(
      'new_room',
      userId.toString(),
    );
    if (!player) {
      throw new Error(`Player with userId ${userId} not found`);
    }
    const updatedPlayer = { ...player, position: { x, y } };
    await this.redisService.pushToList('new_room', updatedPlayer);
    await this.pubSub.publish(PlaygroundAction.USER_MOVED, {
      userMoved: updatedPlayer,
    });
    console.log('Published USER_MOVED:', updatedPlayer);
    return updatedPlayer;
  }
}
