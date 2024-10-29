import { ChainDocument } from '@app/shared/models';
import { Injectable } from '@nestjs/common';
import { Provider, Contract, GetTransactionReceiptResponse } from 'starknet';
import { EventTopic, EventType, LogsReturnValues } from './types';

import {
  CardTransferReturnValue,
  decodeAddPoints,
  decodeCardTransfer,
  decodeCardTransferBatch,
  decodeClaimRewards,
  decodeCreatePool,
  decodeJoinningPool,
  decodeTransferPoint,
} from './decode';
import {
  convertDataIntoString,
  formattedContractAddress,
} from '@app/shared/utils';
import { BURN_ADDRESS, CardCollectionStandard } from '@app/shared/types';
import { ABIS } from './abi';
import { attemptOperations } from '@app/shared/utils/promise';
@Injectable()
export class Web3Service {
  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });
    return provider;
  }
  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('pending');
    return block.timestamp * 1e3;
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

  async getUserCurrentPoints(
    chain: ChainDocument,
    userAddress: string,
  ): Promise<number> {
    const contractInstance = await this.getContractInstance(
      ABIS.BliztABI,
      chain.bliztContractAdress,
      chain.rpc,
    );
    const point = await contractInstance.getUserPoint(userAddress);

    return Number(point as bigint);
  }

  async getPoolDetail(
    poolId: number,
    fuelContract: string,
    chain: ChainDocument,
  ): Promise<{ id: number; startAt: number; endAt: number }> {
    const contractInstance = await this.getContractInstance(
      ABIS.FuelABI,
      fuelContract,
      chain.rpc,
    );

    const poolDetail = await contractInstance.getPoolDetail(poolId);
    return {
      id: Number((poolDetail.id as bigint).toString()),
      startAt: Number((poolDetail.startAt as bigint).toString()) * 1e3,
      endAt: Number((poolDetail.endAt as bigint).toString()) * 1e3,
    };
  }

  getReturnValuesEvent(
    txReceipt: GetTransactionReceiptResponse,
    chain: ChainDocument,
    timestamp: number,
  ): LogsReturnValues[] {
    const eventWithTypes: LogsReturnValues[] = [];
    const provider = this.getProvider(chain.rpc);

    if (txReceipt.isSuccess()) {
      let index = 0;
      for (const event of txReceipt.events) {
        const txReceiptFilter = {
          ...txReceipt,
          events: txReceipt.events.filter((ev) => ev == event),
        };

        if (
          event.keys.includes(EventTopic.ADD_POINT) &&
          chain.bliztContractAdress ==
            formattedContractAddress(event.from_address)
        ) {
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
              index,
            });
          }
        } else if (
          event.keys.includes(EventTopic.TRANSFER_POINT) &&
          chain.bliztContractAdress ==
            formattedContractAddress(event.from_address)
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TransferPoint,
            returnValues: decodeTransferPoint(
              txReceiptFilter,
              provider,
              timestamp,
            ),
            index,
          });
        } else if (
          event.keys.includes(EventTopic.CREATE_POOL) &&
          chain.fuelContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.CreatePool,
            returnValues: decodeCreatePool(txReceiptFilter, provider),
            index,
          });
        } else if (
          event.keys.includes(EventTopic.JOINING_POOL) &&
          chain.fuelContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.JoiningPool,
            returnValues: decodeJoinningPool(
              txReceiptFilter,
              provider,
              timestamp,
            ),
            index,
          });
        } else if (
          event.keys.includes(EventTopic.CLAIM_REWARD) &&
          chain.fuelContracts.includes(
            formattedContractAddress(event.from_address),
          )
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.ClaimReward,
            returnValues: decodeClaimRewards(
              txReceiptFilter,
              provider,
              timestamp,
            ),
            index,
          });
        } else if (
          event.keys.includes(EventTopic.TRANSFER_SINGLE) &&
          chain.cardsContract == formattedContractAddress(event.from_address)
        ) {
          let returnValues: CardTransferReturnValue = null;
          try {
            returnValues = decodeCardTransfer(
              txReceiptFilter,
              provider,
              timestamp,
            );
          } catch (error) {}

          if (returnValues) {
            const eventWithType: LogsReturnValues = {
              ...txReceiptFilter,
              eventType: EventType.TransferCard,
              returnValues,
              index,
            };

            if (returnValues.from === BURN_ADDRESS) {
              eventWithType.eventType = EventType.MintCard;
            }
            if (returnValues.to === BURN_ADDRESS) {
              eventWithType.eventType = EventType.BurnCard;
            }
            eventWithTypes.push(eventWithType);
          }
        }
        if (
          event.keys.includes(EventTopic.TRANSFER_BATCH) &&
          chain.cardsContract == formattedContractAddress(event.from_address)
        ) {
          let returnValues: CardTransferReturnValue[] = [];
          try {
            returnValues = decodeCardTransferBatch(
              txReceiptFilter,
              provider,
              timestamp,
            );
          } catch (error) {}

          if (returnValues.length > 0) {
            for (const value of returnValues) {
              const eventWithType: LogsReturnValues = {
                ...txReceiptFilter,
                eventType: EventType.TransferCard,
                returnValues: value,
                index,
              };

              if (value.from === BURN_ADDRESS) {
                eventWithType.eventType = EventType.MintCard;
              }
              if (value.to === BURN_ADDRESS) {
                eventWithType.eventType = EventType.BurnCard;
              }
              eventWithTypes.push(eventWithType);
            }
          }
        }

        index++;
      }
    }
    return eventWithTypes;
  }

  async getCardUri(
    address: string,
    cardId: string,
    standard: CardCollectionStandard,
    rpc: string,
  ): Promise<string> {
    const provider = this.getProvider(rpc);

    const abi = ABIS.CardsABI;

    const contractInstance = new Contract(abi, address, provider);

    const tokenUriOperations = [() => contractInstance.uri(cardId)];
    const tokenUri = await attemptOperations(tokenUriOperations);

    if (!tokenUri) return null;

    return convertDataIntoString(tokenUri);
  }
}
