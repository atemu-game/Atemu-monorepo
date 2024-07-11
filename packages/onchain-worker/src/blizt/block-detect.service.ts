import { Model } from 'mongoose';

import { OnchainWorker } from '../OnchainWorker';
import {
  BlockDocument,
  BlockWorkerStatus,
  ChainDocument,
} from '@app/shared/models';
import { Web3Service } from 'web3/src/web3.service';
import { BlockStatus, Block, Provider, RpcProvider } from 'starknet';
import configuration from '@app/shared/configuration';
import { arraySliceProcess } from '@app/shared/utils/arrayLimitProcess';
import { retryUntil } from '@app/shared/index';
import { EventType, LogsReturnValues } from 'web3/src/types';
import { Queue } from 'bull';
import { ONCHAIN_JOB } from '@app/shared/constants/queue';
import { OnchainWorkerQueueService } from '../queue/onchainWorkerQueue';

export class BlockDetectService extends OnchainWorker {
  constructor(
    onchainQueue: OnchainWorkerQueueService,
    blockModel: Model<BlockDocument>,
    web3Service: Web3Service,
    chain: ChainDocument,
    addPointQueue: Queue<LogsReturnValues>,
  ) {
    super(1000, 10, `${BlockDetectService.name}:${chain.name}`);

    this.web3Service = web3Service;
    this.chain = chain;
    this.chainId = chain.id;
    this.blockModel = blockModel;
    this.onchainQueue = onchainQueue;
    this.addPointQueue = addPointQueue;
  }
  chainId: string;
  web3Service: Web3Service;
  provider: Provider;
  chain: ChainDocument;
  blockModel: Model<BlockDocument>;
  addPointQueue: Queue<LogsReturnValues>;
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
    this.currentBlock = 78270;

    this.provider = new RpcProvider({ nodeUrl: this.chain.rpc });

    this.logger.log(`chain: ${JSON.stringify(this.chain)}`);
  };

  fillBlockDataBuffer = async (
    blocks: number[],
  ): Promise<{ [k: number]: Block }> => {
    const dataBlocks = await Promise.all(
      blocks.map(async (b) => this.provider.getBlock(b)),
    );

    const groupByBlock: { [k: number]: Block } = dataBlocks.reduce(
      (acc, cur) => {
        if (
          cur.status == BlockStatus.ACCEPTED_ON_L2 ||
          cur.status == BlockStatus.ACCEPTED_ON_L1
        ) {
          acc[cur.block_number] = cur;
          return acc;
        }
      },
      {},
    );

    return groupByBlock;
  };

  process = async (block: Block): Promise<void> => {
    const beginTime = Date.now();
    this.logger.debug(
      `begin process block ${Number(block.block_number)} ${
        block.transactions.length
      } txs`,
    );
    //insert to db
    const blockEntity = await this.blockModel.findOneAndUpdate(
      {
        blockNumber: block.block_number,
        chain: this.chainId,
      },
      {
        $setOnInsert: {
          blockNumber: block.block_number,
          chain: this.chainId,
          transactions: block.transactions,
          status: BlockWorkerStatus.PENDING,
          timestamp: block.timestamp * 1e3,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    const batchProcess = 10;
    const maxRetry = 10;
    //batch process 10 txs, max retry 10 times
    await arraySliceProcess(
      block.transactions,
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
    blockEntity.status = BlockWorkerStatus.SUCCESS;
    await blockEntity.save();

    this.logger.debug(
      `end process block ${Number(block.block_number)} ${block.transactions.length}txs in ${
        Date.now() - beginTime
      }ms`,
    );
  };

  async processTx(txHash: string, timestamp: number) {
    const trasactionReceipt = await this.provider.getTransactionReceipt(txHash);
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

    for (const event of eventWithType) {
      let queue: Queue<LogsReturnValues> = null;
      let jobName: string = null;

      switch (event.eventType) {
        case EventType.AddPoint:
          queue = this.addPointQueue;
          jobName = ONCHAIN_JOB.JOB_ADD_POINT;
          break;
      }
      if (queue && jobName) {
        await this.onchainQueue.add(queue, jobName, event);
      }
    }

    return trasactionReceipt;
  }
}
