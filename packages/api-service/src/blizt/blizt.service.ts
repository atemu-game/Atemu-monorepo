import { Socket } from 'socket.io';

import { Injectable } from '@nestjs/common';
import { decryptData, formattedContractAddress } from '@app/shared/utils';
import { WalletService } from '../wallet/wallet.service';
import { UserService } from '../user/user.service';
import { COMMON_CONTRACT_ADDRESS, RPC_PROVIDER } from '@app/shared/constants';
import { Provider, Account, stark, CallData, shortString } from 'starknet';
import { BliztSatus } from './type';
import configuration from '@app/shared/configuration';

export type BliztParam = {
  socket: Socket;
  status: BliztSatus;
  point: number;
};
@Injectable()
export class BliztService {
  private sockets: BliztParam[] = [];
  constructor(
    private readonly walletService: WalletService,
    private readonly userService: UserService,
  ) {}

  async startMinting(userAddress: string) {
    const formatAddress = formattedContractAddress(userAddress);
    const userExist = await this.userService.getUser(formatAddress);
    if (!userExist.mappingAddress) {
      return {
        message: `User Address argentx not deploy`,
      };
    }

    const payerAddress = formattedContractAddress(
      userExist.mappingAddress.address,
    );
    const decodePrivateKey = decryptData(userExist.mappingAddress.privateKey);
    const provider = new Provider({ nodeUrl: RPC_PROVIDER.TESTNET });
    const accountUser = new Account(provider, payerAddress, decodePrivateKey);

    // Now Account Blizt
    const accountBlizt = new Account(
      provider,
      configuration().ACCOUNT_ADDRESS,
      configuration().PRIVATE_KEY,
    );

    const currentBalance = await this.walletService.getBalanceEth(
      accountUser,
      provider,
    );

    while (currentBalance > 0) {
      try {
        // await new Promise((resolve) => setTimeout(resolve, 5000));
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
                type: 'u128',
              },
              {
                name: 'timestamp',
                type: 'u64',
              },
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
            point: 1,
            timestamp: timestampSetup,
          },
        };
        const signature2 = await accountBlizt.signMessage(typedDataValidate);

        const formatedSignature = stark.formatSignature(signature2);

        const { transaction_hash } = await accountUser.execute({
          contractAddress: COMMON_CONTRACT_ADDRESS.BLIZT,
          entrypoint: 'addPoint',
          calldata: CallData.compile({
            receiver: formatAddress,
            amount: 1,
            timestamp: timestampSetup,
            proof: formatedSignature,
          }),
        });
        await provider.waitForTransaction(transaction_hash);
        console.log(`txHash: ${formatAddress}`, transaction_hash);
      } catch (error) {
        console.log('Error', error);
      }
    }
  }
}
