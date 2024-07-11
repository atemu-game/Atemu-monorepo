import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  UserPoints,
  UserPointsDocument,
} from '@app/shared/models/schema/userpoints.schema';
import { Model } from 'mongoose';
import { formattedContractAddress } from '@app/shared/utils';
import { Users } from '@app/shared/models';
@Injectable()
export class UserPointService {
  constructor(
    @InjectModel(UserPoints.name)
    private readonly userPointsModel: Model<UserPointsDocument>,

    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
  ) {}
  async getUserPoint(address: string): Promise<UserPoints> {
    return await this.userPointsModel.findOne({
      address: formattedContractAddress(address),
    });
  }
  async updateUserPoint(address: string, points: number): Promise<UserPoints> {
    const existUser = await this.usersModel.findOne({
      address: formattedContractAddress(address),
    });
    if (!existUser) {
      throw new Error('User not found');
    }
    const existingUserPoint = await this.getUserPoint(address);
    if (!existingUserPoint) {
      const newUserPoint: UserPoints = {
        address: formattedContractAddress(address),
        points,
      };
      return await this.userPointsModel.create(newUserPoint);
    }

    return await this.userPointsModel.findOneAndUpdate(
      { address: formattedContractAddress(address) },
      { points },
      { upsert: true, new: true },
    );
  }
}
