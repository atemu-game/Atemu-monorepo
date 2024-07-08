import { formattedContractAddress } from '@app/shared/utils';
import { Provider, Contract, num, BigNumberish } from 'starknet';
import { ABIS } from './abi';
export type CreatePointReturnValues = {
  reciver: string;
  point: number; // amount of points
  startedAt: number;
};
export const decodeAddPoints = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
) => {
  const contract = new Contract(
    ABIS.BliztABI,
    formattedContractAddress(txReceipt.events[0].from_address),
    provider,
  );
  const parsedEvent =
    contract.parseEvents(txReceipt)[0]['atemu::point::point::Point::AddPoint'];
  console.log('Activ', parsedEvent);
  const returnValues: CreatePointReturnValues = {
    reciver: formattedContractAddress(
      num.toHex(parsedEvent.user as BigNumberish),
    ),
    point: Number(parsedEvent.point.toString()),
    startedAt: timestamp,
  };

  return returnValues;
};
