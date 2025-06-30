import { Resolver, Subscription } from '@nestjs/graphql';
import { Player } from '../dtos/playground.model';
import { Inject } from '@nestjs/common';
import { PubSubEngine } from 'graphql-subscriptions';
import { PlaygroundAction } from './playground.action';

@Resolver(() => Player)
export class PlaygroundSubscription {
  constructor(@Inject('PUB_SUB') private pubSub: PubSubEngine) {}

  @Subscription(() => Player, {
    resolve: (value) => value.userJoined,
  })
  userJoined() {
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_JOINED);
  }

  @Subscription(() => Player, {
    resolve: (payload) => {
      return payload.playerMoved;
    },
    filter: (payload, variables) => {
      return payload.playerMoved.id !== variables.currentUserId;
    },
  })
  userMoved() {
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_MOVED);
  }

  @Subscription(() => Player, {
    resolve: (value) => value.userDisconnected,
  })
  userDisconnected() {
    return this.pubSub.asyncIterableIterator(
      PlaygroundAction.USER_DISCONNECTED,
    );
  }
}
