import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRoomDto } from '../dtos/createRoom.dto';
import { Room } from '../models/room.model';
import { CurrentUser } from '@decorators/currentUser';
import { Logged } from 'decologger';
import { UpdateRoomDto } from '../dtos/updateRoom.dto';
import { RoomService } from '../services/room.service';
import { InviteToRoomDto } from '../dtos/inviteToRoomDto';

@Resolver()
export class RoomResolver {
  constructor(private roomService: RoomService) {}

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

  @Mutation(() => Boolean)
  async inviteToRoom(
    @CurrentUser() userId: number,
    @Args('input') input: InviteToRoomDto,
  ) {
    await this.roomService.inviteUserToRoom(userId, input);
    return true;
  }
}
