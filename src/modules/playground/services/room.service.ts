import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from '../dtos/createRoom.dto';

@Injectable()
export class RoomSerivice {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(body: CreateRoomDto, ownerId: number) {
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

  async getListRooms(userId: number) {
    return this.prisma.rooms.findMany({
      where: {
        ownerId: userId,
      },
      take: 10,
    });
  }
}
