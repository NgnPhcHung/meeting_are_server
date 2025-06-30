import { CurrentUser } from '@decorators/current-user';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RoomModel } from '../dtos/room.model';
import { RoomSerivice } from '../services/room.service';

@Resolver(() => RoomModel)
export class RoomResolver {
  constructor(private roomService: RoomSerivice) {}
  @Mutation(() => RoomModel)
  async createRoom(
    @Args('room_name') roomName: string,
    @CurrentUser() userId: number,
  ) {}
}
