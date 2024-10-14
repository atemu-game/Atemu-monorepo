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

  console.log('Parsed Event: ', parsedEvent.point.toString());
  const returnValues: CreatePointReturnValues = {
    reciver: formattedContractAddress(
      num.toHex(parsedEvent.user as BigNumberish),
    ),
    point: Number(parsedEvent.point.toString()),
    startedAt: timestamp,
  };

  return returnValues;
};

export type TransferPointReturnValue = {
  from: string;
  to: string;
  value: number;
  timestamp: number;
};

export const decodeTransferPoint = (
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
    contract.parseEvents(txReceipt)[0][
      'atemu::point::point::Point::TransferPoint'
    ];

  const returnValue: TransferPointReturnValue = {
    from: formattedContractAddress(num.toHex(parsedEvent.from as BigNumberish)),
    to: formattedContractAddress(num.toHex(parsedEvent.to as BigNumberish)),
    value: Number((parsedEvent.value as bigint).toString()),
    timestamp,
  };

  return returnValue;
};

export type CreatePoolReturnValue = {
  id: number;
  poolContract: string;
  startAt: number;
  endAt: number;
};

export const decodeCreatePool = (txReceipt: any, provider: Provider) => {
  const poolContract = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contract = new Contract(ABIS.FuelABI, poolContract, provider);

  const parsedEvent =
    contract.parseEvents(txReceipt)[0]['atemu::fuel::fuel::Fuel::CreatePool'];

  const returnValue: CreatePoolReturnValue = {
    id: Number((parsedEvent.id as bigint).toString()),
    poolContract,
    startAt: Number((parsedEvent.startAt as bigint).toString()) * 1e3,
    endAt: Number((parsedEvent.endAt as bigint).toString()) * 1e3,
  };

  return returnValue;
};

export type joinningPoolReturnValue = {
  player: string;
  poolContract: string;
  poolId: number;
  stakedAmount: number;
  joinedAt: number;
};

export const decodeJoinningPool = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
) => {
  const poolContract = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contract = new Contract(ABIS.FuelABI, poolContract, provider);

  const parsedEvent =
    contract.parseEvents(txReceipt)[0]['atemu::fuel::fuel::Fuel::JoiningPool'];

  const returnValue: joinningPoolReturnValue = {
    player: formattedContractAddress(
      num.toHex(parsedEvent.player as BigNumberish),
    ),
    poolContract,
    poolId: Number((parsedEvent.poolId as bigint).toString()),
    stakedAmount: Number((parsedEvent.stakedAmount as bigint).toString()),
    joinedAt: timestamp,
  };

  return returnValue;
};

export type ClaimRewardsReturnValue = {
  poolId: number;
  poolContract: string;
  winner: string;
  totalPoints: number;
  cardAddress: string;
  cardId: string;
  amountCards: number;
  timestamp: number;
};
export const decodeClaimRewards = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
) => {
  const poolContract = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contract = new Contract(ABIS.FuelABI, poolContract, provider);

  const parsedEvent =
    contract.parseEvents(txReceipt)[0]['atemu::fuel::fuel::Fuel::ClaimReward'];
  console.log(parsedEvent);

  const returnValue: ClaimRewardsReturnValue = {
    poolId: Number((parsedEvent.poolId as bigint).toString()),
    poolContract,
    winner: formattedContractAddress(
      num.toHex(parsedEvent.winner as BigNumberish),
    ),
    totalPoints: Number((parsedEvent.totalPoints as bigint).toString()),
    cardAddress: (parsedEvent.cardAddress as bigint).toString(),
    cardId: (parsedEvent.cardId as bigint).toString(),
    amountCards: Number((parsedEvent.amountCards as bigint).toString()),
    timestamp,
  };

  return returnValue;
};

export type CardTransferReturnValue = {
  from: string;
  to: string;
  cardAddress: string;
  tokenId: string;
  value: number;
  timestamp: number;
};

export const decodeCardTransfer = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): CardTransferReturnValue => {
  const cardAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(ABIS.CardsABI, cardAddress, provider);

  const parsedEvent =
    contractInstance.parseEvents(txReceipt)[0][
      'openzeppelin::token::erc1155::erc1155::ERC1155Component::TransferSingle'
    ];
  const returnValue: CardTransferReturnValue = {
    from: formattedContractAddress(num.toHex(parsedEvent.from as BigNumberish)),
    to: formattedContractAddress(num.toHex(parsedEvent.to as BigNumberish)),
    cardAddress,
    tokenId: (parsedEvent.id as bigint).toString(),
    timestamp,
    value: Number((parsedEvent.value as bigint).toString()),
  };

  return returnValue;
};

export const decodeCardTransferBatch = (
  txReceipt: any,
  provider: Provider,
  timestamp: number,
): CardTransferReturnValue[] => {
  const returnValues: CardTransferReturnValue[] = [];
  const cardAddress = formattedContractAddress(
    txReceipt.events[0].from_address,
  );
  const contractInstance = new Contract(ABIS.CardsABI, cardAddress, provider);

  const parsedEvent =
    contractInstance.parseEvents(txReceipt)[0][
      'openzeppelin::token::erc1155::erc1155::ERC1155Component::TransferBatch'
    ];
  const { from, to, ids, values } = parsedEvent;
  const fromAddress = formattedContractAddress(num.toHex(from as BigNumberish));
  const toAddress = formattedContractAddress(num.toHex(to as BigNumberish));
  for (let i = 0; i < (ids as BigNumberish[]).length; i++) {
    returnValues.push({
      from: fromAddress,
      to: toAddress,
      cardAddress,
      tokenId: (ids[i] as bigint).toString(),
      timestamp,
      value: Number((values[i] as bigint).toString()),
    });
  }

  return returnValues;
};
