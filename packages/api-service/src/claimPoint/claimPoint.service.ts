import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ClaimPoint, ClaimPointDocument } from '@app/shared/models';
import { Model } from 'mongoose';
import {
  Provider,
  Account,
  stark,
  shortString,
  uint256,
  CallData,
} from 'starknet';
import configuration from '@app/shared/configuration';
import { formattedContractAddress } from '@app/shared/utils';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import {
  AGEPOINT_PERDAY,
  COMMON_CONTRACT_ADDRESS,
} from '@app/shared/constants';
@Injectable()
export class ClaimPointService {
  constructor(
    @InjectModel(ClaimPoint.name)
    private readonly claimPointModel: Model<ClaimPointDocument>,
    private readonly httpService: HttpService,
  ) {}

  async getOrCreateClaimPoint(userAddress: string) {
    // const formatAddress = formattedContractAddress(userAddress);
    const formatAddress =
      '0x01f85715b98c17208097dd5dcbb40f8084280f26a6f0065cb7fc60a72ac227e9';
    const existClaim = await this.claimPointModel.findOne({
      address: formatAddress,
    });

    if (existClaim) {
      return existClaim;
    }

    const response = await firstValueFrom(
      this.httpService
        .get(`${configuration().API_AGE_WALLET_URL}/block/age/${formatAddress}`)
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );
    const { data } = response;

    if (!data) {
      throw new Error('User Data Sync Not Found');
    }
    const pointTotal = Math.floor(
      Number(data.ageInDays) * Number(AGEPOINT_PERDAY),
    );

    const newDataClaim: ClaimPoint = {
      address: formatAddress,
      agePoints: pointTotal,
      isClaimed: false,
    };
    const newClaimPoint = await this.claimPointModel.create(newDataClaim);
    console.log('What is newClaimPoint', newClaimPoint);
    return newClaimPoint;
  }

  async claimAgePoint(userAddress: string) {
    const formatAddress = formattedContractAddress(userAddress);
    // const formatAddress =
    //   '0x01f85715b98c17208097dd5dcbb40f8084280f26a6f0065cb7fc60a72ac227e9';
    const provider = new Provider({ nodeUrl: configuration().RPC_URL });
    const claimPoint = await this.claimPointModel
      .findOne({
        address:
          '0x01f85715b98c17208097dd5dcbb40f8084280f26a6f0065cb7fc60a72ac227e9',
      })
      .exec();
    if (!claimPoint) {
      throw new Error('Claim Point Not Found');
    }
    const accountBlizt = new Account(
      provider,
      configuration().ACCOUNT_ADDRESS,
      configuration().PRIVATE_KEY,
    );
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
        point: uint256.bnToUint256(claimPoint.agePoints),
        timestamp: timestampSetup,
      },
    };

    const signature2 = await accountBlizt.signMessage(typedDataValidate);

    const formatedSignature = stark.formatSignature(signature2);
    const { transaction_hash } = await accountBlizt.execute({
      contractAddress: COMMON_CONTRACT_ADDRESS.BLIZT,
      entrypoint: 'addPoint',
      calldata: CallData.compile({
        receiver: formatAddress,
        amount: uint256.bnToUint256(claimPoint.agePoints),
        timestamp: timestampSetup,
        proof: formatedSignature,
      }),
    });
    console.log('What is transaction_hash', transaction_hash);
    return {
      formatedSignature: formatedSignature,
      timestampSetup: timestampSetup,
    };
  }
}
