import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { formattedContractAddress } from '@app/shared/utils';
import { ChainDocument, Chains, UserDocument, Users } from '@app/shared/models';
import { v1 as uuidv1 } from 'uuid';
import { Web3Service } from '@app/web3/web3.service';

@Injectable()
export class UserPointService {
  constructor(
    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
    @InjectModel(Chains.name)
    private readonly chainModel: Model<Chains>,
    private readonly web3Service: Web3Service,
  ) {}
  async getUser(address: string): Promise<UserDocument> {
    return await this.usersModel.findOne({
      address: formattedContractAddress(address),
    });
  }

  async getUserOrCreate(
    address: string,
    chain: ChainDocument,
  ): Promise<UserDocument> {
    const formatedAddress = formattedContractAddress(address);
    const userDocument = await this.usersModel.findOne({
      address: formatedAddress,
    });

    if (userDocument) {
      return userDocument;
    }

    const currentPoints = await this.web3Service.getUserCurrentPoints(
      chain,
      formatedAddress,
    );

    const newUser: Users = {
      username: formatedAddress,
      address: formatedAddress,
      nonce: uuidv1(),
      roles: [],
      points: currentPoints,
    };

    return await this.usersModel.findOneAndUpdate(
      { address: formatedAddress },
      { $set: newUser },
      { upsert: true, new: true },
    );
  }

  async updateUserPoint(
    address: string,
    points: number,
    isTransfered: boolean = false,
  ): Promise<UserDocument> {
    const formatedAddress = formattedContractAddress(address);
    const chainDocument = await this.chainModel.findOne();
    const existingUserPoint = await this.getUser(formatedAddress);

    if (!existingUserPoint) {
      const newPoints = !isTransfered
        ? points
        : await this.web3Service.getUserCurrentPoints(
            chainDocument,
            formatedAddress,
          );
      const newUserPoint: Users = {
        address: formatedAddress,
        points: newPoints,
        username: formatedAddress,
        nonce: uuidv1(),
        roles: [],
      };
      return await this.usersModel.findOneAndUpdate(
        { address: formatedAddress },
        { $set: newUserPoint },
        { upsert: true, new: true },
      );
    }

    let newPoint = isTransfered
      ? existingUserPoint.points - points
      : existingUserPoint.points + points;

    if (newPoint < 0) {
      newPoint = await this.web3Service.getUserCurrentPoints(
        chainDocument,
        formatedAddress,
      );
    }

    return await this.usersModel.findOneAndUpdate(
      { address: formatedAddress },
      { $set: { points: newPoint } },
      { upsert: true, new: true },
    );
  }
}
