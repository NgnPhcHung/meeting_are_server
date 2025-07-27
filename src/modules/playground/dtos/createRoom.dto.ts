import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateRoomDto {
  @Field(() => String)
  roomName: string;
}
