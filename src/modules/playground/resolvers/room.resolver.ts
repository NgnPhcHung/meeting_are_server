import { CurrentUser } from '@decorators/current-user';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RoomModel } from '../dtos/room.model';
import { RoomSerivice } from '../services/room.service';

@Resolver(() => RoomModel)
export class RoomResolver {
  constructor(private roomService: RoomSerivice) {}

  @Mutation(() => RoomModel)
  async createRoom(
    @CurrentUser() userId: number,
    @Args('room_name', { type: () => String }) roomName: string,
  ) {
    const createdRoom = await this.roomService.createRoom(roomName, userId);
    console.log('createdRoom', createdRoom);
    return createdRoom;
  }
}
