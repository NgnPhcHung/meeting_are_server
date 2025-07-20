import { Inject, UseFilters } from '@nestjs/common';
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
import { PlaygroundResolver } from '@modules/playground/resolvers/playground.resolver';

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
    { position: { x: number; y: number }; avatarImg: string; userId: number }
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
    if (!userId) {
      console.error('No userId provided in handshake');
      socket.disconnect(true);
      return;
    }
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    console.log(`Disconnected: ${socket.id}`);
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      this.positions.delete(socket.id);
      this.server.emit('player_left', { userId: parseInt(userId, 10) });
    }
  }

  @SubscribeMessage('move')
  async handleMove(
    @MessageBody()
    data: {
      position: { x: number; y: number };
      avatarImg: string;
      userId: number;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('Socket move event:', { socketId: socket.id, data });

    this.positions.set(socket.id, { ...data, position: data.position });
    try {
      await this.playgroundResolver.updatePlayerPositionDirectly(
        data.userId,
        data.position.x,
        data.position.y,
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
