import configuration from '@app/shared/configuration';
import { WsAuthGuard } from '@app/shared/modules/jwt/ws-auth.guard';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { BliztService } from './blizt.service';
@UseGuards(WsAuthGuard)
@WebSocketGateway(configuration().SOCKET_PORT, {
  cors: {
    origin: '*',
  },
})
export class BliztGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly bliztService: BliztService) {}
  private clients: Set<Socket> = new Set();
  afterInit() {
    console.log('BliztGateway initialized successfully');
  }
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clients.add(client);
  }
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client);
  }
  @SubscribeMessage('startNewMint')
  startNewMint(client: Socket, payload: any) {
    const userAddress = (client.handshake as any).user.sub;
    console.log(
      `Start Mint from client ${userAddress}: ${JSON.stringify(payload)}`,
    );
    this.bliztService.startMinting(userAddress);
  }
  @SubscribeMessage('stopMint')
  stopMint(client: Socket, payload: any) {
    const userAddress = (client.handshake as any).user.sub;
    console.log(
      `Stop Mint from client ${userAddress}: ${JSON.stringify(payload)}`,
    );
  }
}
