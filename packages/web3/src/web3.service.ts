import { ChainDocument } from '@app/shared/models';
import { Injectable } from '@nestjs/common';
import { Provider, Contract, GetTransactionReceiptResponse } from 'starknet';
import { EventTopic, EventType, LogsReturnValues } from './types';

import { decodeAddPoints } from './decode';
@Injectable()
export class Web3Service {
  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });
    return provider;
  }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    return block.timestamp;
  }
  async getContractInstance(
    abi: any,
    contractAddress: string,
    rpc: string,
  ): Promise<Contract> {
    const provider = this.getProvider(rpc);
    const contractInstance = new Contract(abi, contractAddress, provider);
    return contractInstance;
  }

  getReturnValuesEvent(
    txReceipt: GetTransactionReceiptResponse,
    chain: ChainDocument,
    timestamp: number,
  ): LogsReturnValues[] {
    const eventWithTypes: LogsReturnValues[] = [];
    const provider = this.getProvider(chain.rpc);

    if (txReceipt.isSuccess()) {
      for (const event of txReceipt.events) {
        const txReceiptFilter = {
          ...txReceipt,
          events: txReceipt.events.filter((ev) => ev == event),
        };

        if (event.keys.includes(EventTopic.ADD_POINT)) {
          const returnValues = decodeAddPoints(
            txReceiptFilter,
            provider,
            timestamp,
          );
          if (returnValues) {
            eventWithTypes.push({
              ...txReceiptFilter,
              eventType: EventType.AddPoint,
              returnValues,
            });
          }
        }
      }
      return eventWithTypes;
    }
  }
}
