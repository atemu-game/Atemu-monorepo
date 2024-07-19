import configuration from '@app/shared/configuration';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { FuelService } from './fuel.service';

@WebSocketGateway(configuration().FUEL_GATEWAY_PORT, {
  cors: {
    origin: '*',
  },
})
export class FuelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly fuelService: FuelService) {}
  async afterInit() {
    console.log(`Fuel WebSocket Gateway initialized`);
    await this.fuelService.handleInit();
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.fuelService.handleConenction(client);
  }
  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
    this.fuelService.handleDisconnection(client);
  }
}
