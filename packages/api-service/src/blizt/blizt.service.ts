import { Socket } from 'socket.io';

import { Injectable } from '@nestjs/common';
import {
  decryptData,
  formattedContractAddress,
  formatBalance,
} from '@app/shared/utils';
import { WalletService } from '../wallet/wallet.service';
import { UserService } from '../user/user.service';
import {
  ABIS,
  COMMON_CONTRACT_ADDRESS,
  RpcProviderSetting,
} from '@app/shared/constants';
import {
  Provider,
  Account,
  stark,
  CallData,
  shortString,
  SuccessfulTransactionReceiptResponse,
  RejectedTransactionReceiptResponse,
  RevertedTransactionReceiptResponse,
  Contract,
  cairo,
  uint256,
} from 'starknet';
import { BliztEvent, BliztSatus } from './type';
import configuration from '@app/shared/configuration';

export type BliztParam = {
  socket: Socket;
  status: BliztSatus;
  point: number;
  balance: number;
  address: string;
};
@Injectable()
export class BliztService {
  private sockets: BliztParam[] = [];
  constructor(
    private readonly walletService: WalletService,
    private readonly userService: UserService,
  ) {}

  private async sendBliztStatus(client: BliztParam) {
    client.socket.emit(BliztEvent.BLIZT_STATUS, client.status);
  }
  private async sendBliztBalance(client: BliztParam) {
    client.socket.emit(BliztEvent.BLIZT_BALANCE, client.balance);
  }
  private async sendBliztPoint(client: BliztParam) {
    client.socket.emit(BliztEvent.BLIZT_POINT, client.point);
  }

  private async sendBliztTransaction(
    client: BliztParam,
    transactionHash: string,
    status: string,
    timestamp: string,
  ) {
    client.socket.emit(BliztEvent.BLIZT_TRANSACTION, {
      transactionHash: transactionHash,
      status: status,
      timestamp: timestamp,
    });
  }

  async handleReconnectBlizt(socket: Socket, userAddress: string) {
    const formatAddress = formattedContractAddress(userAddress);
    // Check If Exist Client Address
    const autoBlizt = this.sockets.find(
      (client) => client.address === formatAddress,
    );
    if (autoBlizt) {
      autoBlizt.socket = socket;
      const client = {
        socket,
        status: autoBlizt.status,
        point: autoBlizt.point,
        address: formatAddress,
        balance: autoBlizt.balance,
      };
      console.log('Current Stattus', autoBlizt);
      this.sendBliztStatus(client);
      this.sendBliztBalance(client);
    }
  }

  async startBlizt(socket: Socket, userAddress: string, rpc: string) {
    let client = this.sockets.find((client) => client.socket === socket);
    if (client && client.status == 'started') {
      socket.emit('error', 'Client already exists Working');
      return;
    }

    const formatAddress = formattedContractAddress(userAddress);

    const point = await this.getUserPoint(userAddress);
    const userExist = await this.userService.getUser(formatAddress);
    if (!userExist.mappingAddress) {
      socket.emit('error', 'Client not have creator account');
      return;
    }

    const payerAddress = formattedContractAddress(
      userExist.mappingAddress.address,
    );
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    try {
      if (client && client.status === 'stopping') {
        client.status = 'stopped';
        this.sendBliztStatus(client);
        return;
      }
      const provider = new Provider({ nodeUrl: rpc });

      const accountUser = new Account(provider, payerAddress, decodePrivateKey);

      if (!client) {
        let currentBalance = await this.walletService.getBalanceEth(
          accountUser,
          provider,
        );
        currentBalance = formatBalance(currentBalance, 18);

        client = {
          socket,
          status: 'starting',
          point: point,
          address: formatAddress,
          balance: currentBalance,
        };
        this.sockets.push(client);
      }
      client.status = 'starting';

      // Now Account Blizt
      const accountBlizt = new Account(
        provider,
        configuration().ACCOUNT_ADDRESS,
        configuration().PRIVATE_KEY,
      );

      client.status = 'started';
      this.sendBliztStatus(client);
      this.sendBliztBalance(client);
      while (client.status == 'started') {
        if (client.status !== 'started') break;

        const timestampSetup = (new Date().getTime() / 1e3).toFixed(0);

        const typedDataValidate = {
          types: {
            StarkNetDomain: [
              {
                name: 'name',
                type: 'felt',
              },
              {
                name: 'version',
                type: 'felt',
              },
              {
                name: 'chainId',
                type: 'felt',
              },
            ],
            SetterPoint: [
              {
                name: 'address',
                type: 'ContractAddress',
              },
              {
                name: 'point',
                type: 'u256',
              },
              {
                name: 'timestamp',
                type: 'u64',
              },
            ],
            u256: [
              { name: 'low', type: 'felt' },
              { name: 'high', type: 'felt' },
            ],
          },
          primaryType: 'SetterPoint',
          domain: {
            name: 'poolpoint',
            version: '1',
            chainId: shortString.encodeShortString('SN_SEPOLIA'),
          },
          message: {
            address: formatAddress,
            point: uint256.bnToUint256(1),
            timestamp: timestampSetup,
          },
        };

        const signature2 = await accountBlizt.signMessage(typedDataValidate);

        const formatedSignature = stark.formatSignature(signature2);

        let currentBalance = await this.walletService.getBalanceEth(
          accountUser,
          provider,
        );
        currentBalance = formatBalance(currentBalance, 18);
        client.balance = currentBalance;
        const { suggestedMaxFee: estimatedFeeMint } =
          await accountBlizt.estimateInvokeFee({
            contractAddress: COMMON_CONTRACT_ADDRESS.BLIZT,
            entrypoint: 'addPoint',
            calldata: CallData.compile({
              receiver: formatAddress,
              amount: uint256.bnToUint256(1),
              timestamp: timestampSetup,
              proof: formatedSignature,
            }),
          });
        if (currentBalance < formatBalance(estimatedFeeMint, 18)) {
          client.status = 'balance_low';
          this.sendBliztStatus(client);
          this.disconnectBlizt(socket);
          break;
        }

        const { transaction_hash } = await accountUser.execute({
          contractAddress: COMMON_CONTRACT_ADDRESS.BLIZT,
          entrypoint: 'addPoint',
          calldata: CallData.compile({
            receiver: formatAddress,
            amount: uint256.bnToUint256(1),
            timestamp: timestampSetup,
            proof: formatedSignature,
          }),
        });
        const txR = await provider.waitForTransaction(transaction_hash, {
          retryInterval: 1000,
        });
        currentBalance = await this.walletService.getBalanceEth(
          accountUser,
          provider,
        );
        client.balance = Number(formatBalance(currentBalance, 18));
        txR.match({
          success: (txR: SuccessfulTransactionReceiptResponse) => {
            console.log('Success =', txR.transaction_hash);
            this.sendBliztTransaction(
              client,
              transaction_hash,
              'success',
              timestampSetup,
            );
          },
          rejected: (txR: RejectedTransactionReceiptResponse) => {
            console.log('Rejected =', txR.transaction_failure_reason);
            this.sendBliztTransaction(
              client,
              transaction_hash,
              'rejected',
              timestampSetup,
            );
          },
          reverted: (txR: RevertedTransactionReceiptResponse) => {
            console.log('Reverted =', txR.transaction_hash);
            this.sendBliztTransaction(
              client,
              transaction_hash,
              'reverted',
              timestampSetup,
            );
          },
          error: (err: Error) => {
            console.log('An error occured =', err.message);
            this.sendBliztTransaction(
              client,
              transaction_hash,
              'error',
              timestampSetup,
            );
          },
        });
        const point = await this.getUserPoint(formatAddress);

        client.point = point;
        this.sendBliztPoint(client);
        this.sendBliztStatus(client);
        this.sendBliztBalance(client);
      }
    } catch (error: any) {
      if (error.message === 'fetch failed') {
        socket.emit('error', 'RPC InvalidLink URL - Fetch Failed');
      }
    }
  }

  async stopBlizt(socket: Socket) {
    const client = this.sockets.find((client) => client.socket === socket);
    if (!client) {
      console.log('Client not exists');
    } else {
      client.status = 'stopped';
      this.sendBliztStatus(client);
    }
  }

  async disconnectBlizt(socket: Socket) {
    this.stopBlizt(socket);
    this.sockets = this.sockets.filter((sk) => sk.socket !== socket);
  }

  async getUserPoint(userAddress: string) {
    const contractBlizt = new Contract(
      ABIS.BliztABI,
      COMMON_CONTRACT_ADDRESS.BLIZT,
      new Provider({ nodeUrl: RpcProviderSetting.TESTNET }),
    );

    const data = await contractBlizt.getUserPoint(userAddress);

    return Number(cairo.uint256(data).low.toString());
  }
}
