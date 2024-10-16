import { Model } from 'mongoose';
import { OnchainWorker } from '../OnchainWorker';
import {
  BlockDocument,
  BlockWorkerStatus,
  ChainDocument,
  TransactionWorkerStatus,
  TransactionWorkerType,
} from '@app/shared/models';
import { Web3Service } from 'web3/src/web3.service';
import { BlockStatus, Provider, RpcProvider, GetBlockResponse } from 'starknet';
import configuration from '@app/shared/configuration';
import { arraySliceProcess } from '@app/shared/utils/arrayLimitProcess';
import { retryUntil } from '@app/shared/index';
import { EventType, LogsReturnValues } from 'web3/src/types';
import { Queue } from 'bull';
import { ONCHAIN_JOB } from '@app/shared/constants/queue';
import { OnchainWorkerQueueService } from '../queue/onchainWorkerQueue';
import * as _ from 'lodash';

export class BlockDetectService extends OnchainWorker {
  constructor(
    onchainQueue: OnchainWorkerQueueService,
    blockModel: Model<BlockDocument>,
    web3Service: Web3Service,
    chain: ChainDocument,
    addPointQueue: Queue<LogsReturnValues>,
    transferPointQueue: Queue<LogsReturnValues>,
    createFuelPoolQueue: Queue<LogsReturnValues>,
    joinFuelPoolQueue: Queue<LogsReturnValues>,
    claimFuelRewardQueue: Queue<LogsReturnValues>,
    mintCardQueue: Queue<LogsReturnValues>,
    transferCardQueue: Queue<LogsReturnValues>,
  ) {
    super(1000, 10, `${BlockDetectService.name}:${chain.name}`);

    this.web3Service = web3Service;
    this.chain = chain;
    this.chainId = chain.id;
    this.blockModel = blockModel;
    this.onchainQueue = onchainQueue;
    this.addPointQueue = addPointQueue;
    this.transferPointQueue = transferPointQueue;
    this.createFuelPoolQueue = createFuelPoolQueue;
    this.joinFuelPoolQueue = joinFuelPoolQueue;
    this.claimFuelRewardQueue = claimFuelRewardQueue;
    this.mintCardQueue = mintCardQueue;
    this.transferCardQueue = transferCardQueue;
  }
  chainId: string;
  web3Service: Web3Service;
  provider: Provider;
  chain: ChainDocument;
  blockModel: Model<BlockDocument>;
  addPointQueue: Queue<LogsReturnValues>;
  transferPointQueue: Queue<LogsReturnValues>;
  createFuelPoolQueue: Queue<LogsReturnValues>;
  joinFuelPoolQueue: Queue<LogsReturnValues>;
  claimFuelRewardQueue: Queue<LogsReturnValues>;
  mintCardQueue: Queue<LogsReturnValues>;
  transferCardQueue: Queue<LogsReturnValues>;
  onchainQueue: OnchainWorkerQueueService;

  fetchLatestBlock: () => Promise<number> = async () => {
    const latestBlock = await this.provider.getBlock('latest');
    return latestBlock.block_number - Number(this.chain.delayBlock || 0);
  };

  init = async () => {
    const latestBlock = await this.blockModel
      .findOne({
        status: BlockWorkerStatus.SUCCESS,
      })
      .sort({ blockNumber: -1 });
    this.currentBlock =
      (latestBlock?.blockNumber || configuration().BEGIN_BLOCK - 1) + 1;

    this.provider = new RpcProvider({ nodeUrl: this.chain.rpc });

    this.logger.log(`chain: ${JSON.stringify(this.chain)}`);
  };

  fillBlockDataBuffer = async (
    blocks: (number | 'pending')[],
  ): Promise<{ [k: number]: GetBlockResponse }> => {
    const dataBlocks = await Promise.all(
      blocks.map(async (b) => this.provider.getBlock(b)),
    );

    const groupByBlock: { [k: number]: GetBlockResponse } = dataBlocks.reduce(
      (acc, cur) => {
        if (
          cur.status == BlockStatus.ACCEPTED_ON_L2 ||
          cur.status == BlockStatus.ACCEPTED_ON_L1
        ) {
          acc[cur.block_number] = cur;
          return acc;
        }

        if (cur.status == BlockStatus.PENDING) {
          acc[this.pendingBlock] = cur;
          return acc;
        }
      },
      {},
    );

    return groupByBlock;
  };

  process = async (block: GetBlockResponse): Promise<void> => {
    const beginTime = Date.now();
    // const blockNumber =
    //   block.status == BlockStatus.ACCEPTED_ON_L2 ||
    //   block.status == BlockStatus.ACCEPTED_ON_L1
    //     ? block.block_number
    //     : this.pendingBlock;

    const blockNumber = 241043;
    this.logger.debug(
      `begin process block ${Number(blockNumber)} ${
        block.transactions.length
      } txs`,
    );
    let transactionWorker: TransactionWorkerType[] = block.transactions.map(
      (tx) => {
        return { txHash: tx, status: TransactionWorkerStatus.PENDING };
      },
    );

    let blockEntity = await this.blockModel.findOne({
      blockNumber: blockNumber,
      chain: this.chainId,
    });

    if (!blockEntity) {
      //insert to db
      blockEntity = await this.blockModel.findOneAndUpdate(
        {
          blockNumber: blockNumber,
          chain: this.chainId,
        },
        {
          $setOnInsert: {
            blockNumber: blockNumber,
            chain: this.chainId,
            transactions: transactionWorker,
            status: BlockWorkerStatus.PENDING,
            timestamp: block.timestamp * 1e3,
          },
        },
        {
          upsert: true,
          new: true,
        },
      );
    } else {
      transactionWorker = _.unionBy(
        blockEntity.transactions,
        transactionWorker,
        'txHash',
      );
    }

    const batchProcess = 100;
    const maxRetry = 10;
    //batch process 10 txs, max retry 10 times
    await arraySliceProcess(
      transactionWorker,
      async (txs) => {
        await Promise.all(
          txs.map(async (tx) => {
            await retryUntil(
              async () => this.processTx(tx, block.timestamp * 1e3),
              () => true,
              maxRetry,
            );
          }),
        );
      },
      batchProcess,
    );

    if (blockNumber !== this.pendingBlock) {
      blockEntity.status = BlockWorkerStatus.SUCCESS;
    }
    blockEntity.transactions = transactionWorker;
    await this.blockModel.findOneAndUpdate(
      { blockNumber: blockEntity.blockNumber },
      { $set: blockEntity },
      { upsert: true },
    );

    this.logger.debug(
      `end process block ${Number(blockNumber)} ${block.transactions.length}txs in ${
        Date.now() - beginTime
      }ms`,
    );
  };

  async processTx(tx: TransactionWorkerType, timestamp: number) {
    try {
      const { status, txHash } = tx;

      if (status == TransactionWorkerStatus.SUCCESS) {
        return tx;
      }
      const trasactionReceipt =
        await this.provider.getTransactionReceipt(txHash);
      if (!trasactionReceipt) {
        // throw new Error(`Can not get transaction receipt ${txHash}`);
        return undefined;
      }

      //parse event
      const eventWithType = this.web3Service.getReturnValuesEvent(
        trasactionReceipt,
        this.chain,
        timestamp,
      );

      const matchClaimRewardEv = eventWithType.filter(
        (ev) => ev.eventType === EventType.ClaimReward,
      );

      const matchJoinFuelPool = eventWithType.filter(
        (ev) => ev.eventType === EventType.JoiningPool,
      );

      const eventlogs = eventWithType.filter((ev) => {
        if (ev.eventType === EventType.MintCard) {
          return !matchClaimRewardEv.find(
            (e) => e.transaction_hash == ev.transaction_hash,
          );
        }

        if (ev.eventType == EventType.TransferPoint) {
          return !matchJoinFuelPool.find(
            (e) => e.transaction_hash == ev.transaction_hash,
          );
        }

        return true;
      });

      if (eventlogs.length > 0) {
        console.log(eventlogs);
      }

      for (const event of eventlogs) {
        let queue: Queue<LogsReturnValues> = null;
        let jobName: string = null;

        switch (event.eventType) {
          case EventType.AddPoint:
            queue = this.addPointQueue;
            jobName = ONCHAIN_JOB.JOB_ADD_POINT;
            break;
          case EventType.TransferPoint:
            queue = this.transferPointQueue;
            jobName = ONCHAIN_JOB.JOB_TRANSFER_POINT;
            break;
          case EventType.CreatePool:
            queue = this.createFuelPoolQueue;
            jobName = ONCHAIN_JOB.JOB_CREATE_POOL;
            break;
          case EventType.JoiningPool:
            queue = this.joinFuelPoolQueue;
            jobName = ONCHAIN_JOB.JOB_JOIN_POOL;
            break;
          case EventType.ClaimReward:
            queue = this.claimFuelRewardQueue;
            jobName = ONCHAIN_JOB.JOB_CLAIM_FUEL_REWARD;
            break;
          case EventType.MintCard:
            queue = this.mintCardQueue;
            jobName = ONCHAIN_JOB.JOB_MINT_CARD;
            break;
          case EventType.TransferCard:
            queue = this.transferCardQueue;
            jobName = ONCHAIN_JOB.JOB_TRANSFER_CARD;
            break;
        }
        if (queue && jobName) {
          await this.onchainQueue.add(queue, jobName, event);
        }
      }

      tx.status = TransactionWorkerStatus.SUCCESS;
      return tx;
    } catch (error) {
      this.logger.error(
        `get error when detect tx - ${tx.txHash} - error: ${error}`,
      );
    }
  }
}
