import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RoomSerivice } from '../services/room.service';
import { CreateRoomDto } from '../dtos/createRoom.dto';
import { Room } from '../models/room.model';
import { CurrentUser } from '@decorators/currentUser';
import { Logged } from 'decologger';
import { UpdateRoomDto } from '../dtos/updateRoom.dto';

@Resolver(() => Room)
export class RoomResolver {
  constructor(private roomService: RoomSerivice) {}

  @Mutation(() => Room)
  @Logged({
    formatter(data) {
      return `Execute [${data.methodName}] with ${data.params}`;
    },
  })
  async createRoom(
    @CurrentUser() userId: number,
    @Args('input') input: CreateRoomDto,
  ) {
    return this.roomService.createRoom(input, userId);
  }

  @Mutation(() => Room)
  @Logged({
    formatter(data) {
      return `Execute [${data.methodName}] with ${data.params}`;
    },
  })
  async updateRoom(@Args('input') input: UpdateRoomDto) {
    return this.roomService.updateRoom(input);
  }

  @Query(() => [Room])
  @Logged({
    formatter(data) {
      return `Execute [${data.methodName}] with ${data.params}`;
    },
  })
  async getListRooms(@CurrentUser() userId: number) {
    return this.roomService.getListRooms(userId);
  }
}
