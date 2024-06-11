import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import configuration from '@app/shared/configuration';

import { GetSignatureTestDto, GetTokenReqDto } from './dto/authQuery.dto';
import {
  WeierstrassSignatureType,
  shortString,
  TypedData,
  Provider,
  Account,
  typedData,
  stark,
} from 'starknet';

import {
  convertDataIntoString,
  formattedContractAddress,
} from '@app/shared/utils';

import { JwtPayload } from '@app/shared/modules/jwt/jwt.dto';
import { Web3Service } from '@app/shared/modules';
import { ABIS } from '@app/shared/constants';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
  ) {
    this.web3Service = new Web3Service();
  }
  private readonly web3Service: Web3Service;
  async getSignMessage(address: string, nonce: string) {
    const formatAddress = formattedContractAddress(address);
    const typedDataValidate: TypedData = {
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        Validate: [
          { name: 'address', type: 'felt' },
          { name: 'nonce', type: 'selector' },
        ],
      },
      primaryType: 'Validate',
      domain: {
        name: 'atemu',
        version: '1',
        chainId: shortString.encodeShortString(configuration().CHAIN_ID),
      },
      message: {
        address: formatAddress,
        nonce: nonce,
      },
    };
    return typedDataValidate;
  }
  async verifySignature(address: string, signature: string[], rpc: string) {
    const user = await this.userService.getUser(address);

    const message = await this.getSignMessage(address, user.nonce);
    try {
      const msgHash = typedData.getMessageHash(message, address);

      const accountContract = await this.web3Service.getContractInstance(
        ABIS.AccountABI,
        address,
        rpc,
      );

      const result = await accountContract.is_valid_signature(
        msgHash,
        signature,
      );

      // const result1 = ec.starkCurve.verify(signature, msgHash, publicKey);

      // console.log('Why Result', result);
      // console.log('Result ', BigNumberishToText(result));
      // return result1;

      return convertDataIntoString(result);
    } catch (error) {
      throw new Error(error);
    }
  }

  async login({ address, signature, rpc }: GetTokenReqDto) {
    const accessPayload = {
      sub: formattedContractAddress(address),
      role: [],
    };

    const data = await this.verifySignature(address, signature, rpc);

    if (!data) {
      throw new Error('Signature is not valid');
    }
    // const user = await this.userService.getUser(address);
    // if (!user.mappingAddress) {
    //   await this.walletService.getOrCreateWalletByEth(address);
    // }
    const token = await this.generateToken(accessPayload);
    await this.userService.updateRandomNonce(address);
    return {
      token: token,
    };
  }

  async generateToken(accessPayload: JwtPayload) {
    const token = await this.jwtService.signAsync(accessPayload, {
      secret: configuration().JWT_SECRET,
    });
    return token;
  }

  // Test Function
  async testSignMessage({
    address,
    privateKey,
    nonce,
  }: GetSignatureTestDto & { nonce: string }) {
    address = formattedContractAddress(address);

    const provider = new Provider({ nodeUrl: configuration().RPC_URL });

    const account = new Account(provider, address, privateKey);

    //Get SignMessage
    const message = await this.getSignMessage(address, nonce);

    const signature = (await account.signMessage(
      message,
    )) as WeierstrassSignatureType;

    const formatSignature = stark.formatSignature(signature);
    // Return Data
    // const dataToken = await this.login({
    //   address,
    //   signature: formatSignature,
    //   rpc: configuration().RPC_URL,
    // });
    return {
      // dataToken,
      signature: formatSignature,
    };
  }
}
