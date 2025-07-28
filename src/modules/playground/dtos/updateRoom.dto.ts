import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateRoomDto {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  roomName: string;
}
