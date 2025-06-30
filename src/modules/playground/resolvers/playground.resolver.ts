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
import { PubSubEngine } from 'graphql-subscriptions';
import { Player } from '../dtos/playground.model';
import { RoomModel } from '../dtos/room.model';
import { PlaygroundService } from '../services/playground.service';

@Resolver(() => Player)
export class PlaygroundResolver {
  constructor(
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
      return existedUser;
    }

    const newPlayer = {
      userId,
      avatarImg: await this.playgroundService.generateRandomAvatar(),
      position: { x: 100, y: 100 },
    };

    await this.redisSerivce.pushToList('new_room', newPlayer);
    await this.pubSub.publish('USER_JOIN', { userJoined: { userId } });
    return newPlayer;
  }

  @Mutation(() => Player)
  async updatePlayerPosition(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('x', { type: () => Float }) x: number,
    @Args('y', { type: () => Float }) y: number,
  ): Promise<Player> {
    let currentPlayer = await this.redisSerivce.getData(`player:${userId}`);

    if (!currentPlayer) {
      const avatarImg = await this.playgroundService.generateRandomAvatar();
      currentPlayer = {
        userId,
        position: { x, y },
        avatarImg,
      };
      console.log(`New player joined game: ${userId}`);
    } else {
      currentPlayer.position = { x, y };
    }

    this.players[userId] = currentPlayer;
    await this.pubSub.publish('PLAYER_MOVED', { playerMoved: currentPlayer });
    return currentPlayer;
  }

  @Mutation(() => Player)
  async disconnectUser(@CurrentUser() userId: number) {
    let userInList: Player[] = await this.redisSerivce.getHashKey(
      `new_room`,
      userId.toString(),
    );
    if (userInList) {
      await this.redisSerivce.deleteData(`player:${userId}`);
      await this.redisSerivce.removeFromHash('new_room', userId.toString());
      await this.pubSub.publish('USER_DISCONNECTED', {
        userDisconnected: userInList,
      });
      return userInList;
    }

    return {
      userId: -1,
      position: { x: -1, y: -1 },
      avatarImg: '',
    };
  }

  //Subscription
}
