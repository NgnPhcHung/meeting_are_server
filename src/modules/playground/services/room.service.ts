import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomSerivice {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(roomName: string, ownerId: number) {
    return this.prisma.rooms.create({
      data: {
        participants: [],
        roomName,
        owner: {
          connect: { id: ownerId },
        },
      },
    });
  }
}
