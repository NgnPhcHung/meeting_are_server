import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RoomModel {
  @Field()
  roomName: string;

  @Field(Int)
  owner: number;

  @Field(() => [Int])
  participants: number[];
}
