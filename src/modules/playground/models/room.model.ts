import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Room {
  @Field(() => Int)
  id: number;

  @Field()
  roomName: string;

  @Field(() => Int)
  ownerId: number;

  @Field(() => [Int])
  participants: number[];
}
