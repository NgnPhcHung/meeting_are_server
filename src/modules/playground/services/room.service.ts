import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from '../dtos/createRoom.dto';
import {
  AppBadRequest,
  AppConflictException,
  AppNotFoundException,
} from '@utils/network/exception';
import { ERROR_CODE } from '@consts/error-code';
import { UpdateRoomDto } from '../dtos/updateRoom.dto';
import { InviteToRoomDto } from '../dtos/inviteToRoomDto';
import { MailService } from '@modules/mail/mail.service';

@Injectable()
export class RoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}
  async getRoomById(roomId: number, ownerId: number) {
    return this.prisma.rooms.findUnique({
      where: {
        id: roomId,
        ownerId,
      },
    });
  }

  async createRoom(body: CreateRoomDto, ownerId: number) {
    const userRoom = await this.getListRooms(ownerId);

    if (userRoom.length >= 3) {
      throw new AppBadRequest(ERROR_CODE.MAX_NUMBER_OF_ROOM_REACHED);
    }

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
    });
  }

  async inviteUserToRoom(ownerId: number, body: InviteToRoomDto) {
    try {
      const room = await this.getRoomById(body.roomId, ownerId);

      if (!room) {
        throw new AppNotFoundException(ERROR_CODE.ROOM_DOES_NOT_EXIST);
      }
      const inviter = await this.prisma.users.findUnique({
        where: {
          id: ownerId,
        },
      });
      await this.mailService.sendEmail({
        to: body.participants,
        subject: `Invite to Meeting Area flatform by ${inviter.email}`,
        html: `http://localhost:3000/playground/${room.id}`,
      });
    } catch (error) {
      throw new Error(ERROR_CODE.APP_ERROR);
    }
  }
}
