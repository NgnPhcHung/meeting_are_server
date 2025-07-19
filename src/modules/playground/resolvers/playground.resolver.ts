import { CurrentUser } from '@decorators/current-user';
import { RedisService } from '@modules/redis/redis.service';
import { Inject } from '@nestjs/common';
import {
  Args,
  Float,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub, PubSubEngine } from 'graphql-subscriptions';
import { Player } from '../dtos/playground.model';
import { PlaygroundService } from '../services/playground.service';
import { PlaygroundAction } from '../subscriptions/playground.action';
import { Public } from '@decorators/public';

@Resolver(() => Player)
// @Logged({
//   logResult: true,
//   formatter(data) {
//     return `${data.methodName} in ${data.duration?.toFixed(2)} ${data.params ? `with params ${data.params} ` : ''}`;
//   },
// })
export class PlaygroundResolver {
  constructor(
    @Inject('PUB_SUB') private pubSub: PubSub,
    private redisSerivce: RedisService,
    private playgroundService: PlaygroundService,
  ) {}

  @Query(() => [Player])
  async players(): Promise<Player[]> {
    const players = await this.redisSerivce.getList<Player>('new_room');
    return players;
  }

  @Mutation(() => Player)
  async userJoinPlayground(
    @Args('userId', { type: () => Int }) userId: number,
  ): Promise<Player> {
    const existedUser = await this.redisSerivce.getHashKey<Player>(
      'new_room',
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

    await this.redisSerivce.pushToList('new_room', newPlayer);
    await this.pubSub.publish(PlaygroundAction.USER_JOINED, {
      userJoined: newPlayer,
    });

    console.log('Published USER_JOINED:', newPlayer);

    return newPlayer;
  }

  @Mutation(() => Player)
  async updatePlayerPosition(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('x', { type: () => Float }) x: number,
    @Args('y', { type: () => Float }) y: number,
  ): Promise<Player> {
    let currentPlayer: Player = await this.redisSerivce.getHashKey(
      'new_room',
      userId.toString(),
    );

    if (!currentPlayer) {
      return;
    }
    currentPlayer.position = { x, y };

    await this.redisSerivce.removeFromHash('new_room', userId.toString());
    await this.redisSerivce.pushToList('new_room', currentPlayer);

    await this.pubSub.publish(PlaygroundAction.USER_MOVED, {
      playerMoved: currentPlayer,
    });

    return currentPlayer;
  }

  @Mutation(() => Player)
  async disconnectUser(@CurrentUser() userId: number) {
    const userDisconnect: Player[] = await this.redisSerivce.getHashKey(
      `new_room`,
      userId.toString(),
    );
    if (userDisconnect) {
      await this.redisSerivce.deleteData(`player:${userId}`);
      await this.redisSerivce.removeFromHash('new_room', userId.toString());
      await this.pubSub.publish(PlaygroundAction.USER_DISCONNECTED, {
        userDisconnected: userDisconnect,
      });
      return userDisconnect;
    }

    return {
      userId: -1,
      position: { x: -1, y: -1 },
      avatarImg: '',
    };
  }

  // subscriptions
  @Public()
  @Subscription(() => Player, {
    resolve: (payload) => payload.userJoined,
  })
  userJoined() {
    console.log('Client subscribed to user joined');
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_JOINED);
  }

  @Public()
  @Subscription(() => Player, {
    resolve: (payload) => {
      console.log('Payload received in subscription:', payload);
      return payload.playerMoved;
    },
  })
  userMoved() {
    console.log('Client subscribed to userMoved log from resolver');
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_MOVED);
  }

  @Public()
  @Subscription(() => Player, {
    resolve: (value) => value.userDisconnected,
  })
  userDisconnected() {
    return this.pubSub.asyncIterableIterator(
      PlaygroundAction.USER_DISCONNECTED,
    );
  }
}
