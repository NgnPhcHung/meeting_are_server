import { Inject } from '@nestjs/common';
import { Resolver, Subscription } from '@nestjs/graphql';
import { PubSubEngine } from 'graphql-subscriptions';
import { Player } from '../dtos/playground.model';
import { PlaygroundAction } from './playground.action';

@Resolver(() => Player)
export class PlaygroundSubscription {
  constructor(@Inject('PUB_SUB') private pubSub: PubSubEngine) {}

  @Subscription(() => Player, {
    resolve: (payload) => payload.userJoined,
  })
  userJoined() {
    return this.pubSub.asyncIterableIterator(PlaygroundAction.USER_JOINED);
  }

  @Subscription(() => Player, {
    resolve: (payload) => {
      console.log('Payload received in subscription:', payload);
      return payload.playerMoved;
    },
  })
  userMoved() {
    console.log('Client subscribed to userMoved');
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
