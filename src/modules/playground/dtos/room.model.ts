import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RoomModel {
  @Field()
  roomName: string;

  @Field(() => Int)
  ownerId: number;

  @Field(() => [Int])
  participants: number[];
}
