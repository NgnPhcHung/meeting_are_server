import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from '../dtos/createRoom.dto';
import { AppConflictException } from '@utils/network/exception';
import { ERROR_CODE } from '@consts/error-code';
import { UpdateRoomDto } from '../dtos/updateRoom.dto';

@Injectable()
export class RoomSerivice {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(body: CreateRoomDto, ownerId: number) {
    const existingRoom = await this.prisma.rooms.count({
      where: { roomName: body.roomName },
    });

    if (existingRoom > 1) {
      throw new AppConflictException(ERROR_CODE.ROOM_ALREADY_EXIST);
    }

    return this.prisma.rooms.create({
      data: {
        participants: [],
        roomName: body.roomName,
        owner: {
          connect: { id: ownerId },
        },
      },
    });
  }

  async updateRoom(body: UpdateRoomDto) {
    const existingRoom = await this.prisma.rooms.findUnique({
      where: {
        id: body.id,
      },
    });

    if (!existingRoom) {
      throw new AppConflictException(ERROR_CODE.ROOM_ALREADY_EXIST);
    }

    return this.prisma.rooms.update({
      where: {
        id: body.id,
      },

      data: body,
    });
  }

  async getListRooms(userId: number) {
    return this.prisma.rooms.findMany({
      where: {
        ownerId: userId,
      },
      take: 3,
    });
  }
}
