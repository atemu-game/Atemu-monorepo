import { InjectModel } from '@nestjs/mongoose';
import { UserConfig, UserDocument, Users } from '@app/shared/models';
import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';

import { v1 as uuidv1 } from 'uuid';
import { formattedContractAddress } from '@app/shared/utils';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(UserConfig.name) private userConfigModel: Model<UserConfig>,
  ) {}

  async getOrCreateUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    let user = await this.userModel.findOne({
      address: formatAddress,
    });
    if (!user) {
      const newUser: Users = {
        address: formatAddress,
        username: formatAddress,
        nonce: uuidv1(),
        isVerified: false,
        roles: [],
      };

      user = await this.userModel.create(newUser);
    }
    return user;
  }
  async updateRandomNonce(address: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(address);

    const user = await this.userModel
      .findOneAndUpdate(
        { address: formatAddress },
        { $set: { nonce: uuidv1() } },
        { new: true },
      )
      .exec();

    return user;
  }

  async getUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    return await this.userModel
      .findOne({ address: formatAddress })
      .populate('mappingAddress');
  }

  async getDefaultRPC() {
    const ListPublicRPC = [
      'https://starknet-sepolia.public.blastapi.io',
      'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
      'https://starknet-sepolia.public.blastapi.io/rpc/v0_6',
      'https://starknet-sepolia.reddio.com/rpc/v0_7',
      'https://starknet-sepolia.reddio.com',
    ];
    return ListPublicRPC;
  }

  async configCustomRPC(address: string, rpc: string[]) {
    const formatAddress = formattedContractAddress(address);
    const user = await this.userModel.findOne({
      address: formatAddress,
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const userRPC = await this.userConfigModel
      .findOneAndUpdate(
        { address: formatAddress },
        { $set: { rpc: rpc } },
        { new: true },
      )
      .exec();

    return userRPC;
  }
}
