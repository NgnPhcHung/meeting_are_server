import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomSerivice {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(roomName: string, ownerId: number) {
    this.prisma.rooms.create({
      data: {
        ownerId,
        participants: [],
        roomName,
        owner: {
          connect: { id: ownerId },
        },
      },
    });
  }
}
