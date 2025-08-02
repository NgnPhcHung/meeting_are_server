import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEmail } from 'class-validator';

@InputType()
export class InviteToRoomDto {
  @Field(() => Int)
  roomId: number;

  @Field(() => [String])
  @IsEmail({}, { each: true })
  participants: string[];
}
