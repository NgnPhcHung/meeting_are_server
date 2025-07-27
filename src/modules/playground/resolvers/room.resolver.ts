import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RoomSerivice } from '../services/room.service';
import { CreateRoomDto } from '../dtos/createRoom.dto';
import { Room } from '../models/room.model';
import { CurrentUser } from '@decorators/currentUser';
import { Logged } from 'decologger';

@Resolver(() => Room)
export class RoomResolver {
  constructor(private roomService: RoomSerivice) {}

  @Mutation(() => Room)
  @Logged({
    formatter(data) {
      return `Executee [${data.methodName}] with ${data.params}`;
    },
  })
  async createRoom(
    @CurrentUser() userId: number,
    @Args('input') input: CreateRoomDto,
  ) {
    return this.roomService.createRoom(input, userId);
  }

  @Query(() => [Room])
  @Logged({
    formatter(data) {
      return `Executee [${data.methodName}] with ${data.params}`;
    },
  })
  async getListRooms(@CurrentUser() userId: number) {
    const rooms = await this.roomService.getListRooms(userId);

    return rooms;
  }
}
