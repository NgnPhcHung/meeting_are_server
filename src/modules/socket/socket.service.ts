import { PlaygroundResolver } from '@modules/playground/resolvers/playground.resolver';
import { UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketsExceptionFilter } from './socket.exception-filter';
import { Logged } from 'decologger';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  path: '/socket.io/',
})
@UseFilters(new WebsocketsExceptionFilter())
export class SocketService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private positions = new Map<
    string,
    {
      position: { x: number; y: number };
      avatarImg: string;
      userId: number;
      roomName?: string;
    }
  >();

  @WebSocketServer()
  server: Server;

  constructor(
    private configService: ConfigService,
    private playgroundResolver: PlaygroundResolver,
  ) {}

  afterInit(server: Server) {
    console.log('Socket.IO server initialized');
    this.positions.clear();
  }

  async handleConnection(socket: Socket) {
    console.log(`Connected: ${socket.id}`);
    const userId = socket.handshake.query.userId as string;
    const roomName = socket.handshake.query.roomName as string;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // if (roomName) {
    //   socket.join(roomName);
    //   console.log(`Socket ${socket.id} joined room ${roomName}`);
    //   this.positions.set(socket.id, {
    //     userId: parseInt(userId, 10),
    //     position: { x: 100, y: 100 },
    //     avatarImg: '',
    //     roomName,
    //   });
    //   this.server
    //     .to(roomName)
    //     .emit('player_joined', { userId: parseInt(userId, 10) });
    // }
  }

  handleDisconnect(socket: Socket) {
    console.log(`Disconnected: ${socket.id}`);
    const userId = socket.handshake.query.userId as string;
    const roomName = socket.handshake.query.roomName as string;

    if (userId && roomName) {
      this.positions.delete(socket.id);
      this.server
        .to(roomName)
        .emit('player_left', { userId: parseInt(userId, 10) });
      socket.leave(roomName);
    }
  }

  @SubscribeMessage('join_room')
  @Logged({
    formatter: (data) =>
      `Execute [${data.methodName}] with params ${data.params}`,
  })
  async handleJoinRoom(
    @MessageBody() data: { roomName: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { roomName } = data;
    if (!roomName) {
      socket.emit('error', { message: 'Room name is required' });
      return;
    }

    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room ${roomName}`);

    this.server.to(roomName).emit('player_joined', {
      userId: parseInt(socket.handshake.query.userId as string, 10),
    });
  }

  @SubscribeMessage('move')
  async handleMove(
    @MessageBody()
    data: {
      position: { x: number; y: number };
      avatarImg: string;
      userId: number;
      roomName: string;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    this.positions.set(socket.id, { ...data, position: data.position });
    try {
      await this.playgroundResolver.updatePlayerPositionDirectly(
        data.userId,
        data.position.x,
        data.position.y,
        data.roomName,
      );
      socket.broadcast.emit('moved', {
        userId: data.userId,
        position: data.position,
      });
    } catch (err) {
      console.error('Error publishing userMoved:', err);
      socket.emit('error', { message: err.message });
    }
  }
}
