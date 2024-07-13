import { InjectModel } from '@nestjs/mongoose';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { Injectable } from '@nestjs/common';
import {
  UserPoints,
  UserPointsDocument,
} from '@app/shared/models/schema/userpoints.schema';
import { Model } from 'mongoose';
import { LeaderBoardFilterParams } from './types';
import { UserPointsDTO } from '@app/shared/models/dtos/userpoints.dto';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { formattedContractAddress } from '@app/shared/utils';
@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(UserPoints.name)
    private userPointModel: Model<UserPointsDocument>,
  ) {}
  async getLeaderboard(query: LeaderBoardFilterParams) {
    const result = new BaseResultPagination<UserPointsDTO>();
    const filter: any = {};

    const count = await this.userPointModel.countDocuments(filter);
    if (query.size === 0) {
      result.data = new PaginationDto([], count, query.page, query.size);
      return result;
    }
    const items = await this.userPointModel
      .find(filter)
      .sort({ points: -1 })
      .skip(query.skipIndex)
      .limit(query.size)
      .exec();
    result.data = new PaginationDto(items, count, query.size, query.page);
    return result;
  }

  async getLeaderboardByAddress(address: string) {
    const formataddress = formattedContractAddress(address);
    const pipeline = [
      {
        $addFields: {
          isTargetUser: {
            $cond: [{ $eq: ['$address', formataddress] }, true, false],
          },
        },
      },
      {
        $sort: { points: -1 } as Record<string, -1 | 1>,
      },
      {
        $group: {
          _id: null,
          users: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          users: 1,
          targetUserIndex: {
            $indexOfArray: ['$users.isTargetUser', true],
          },
        },
      },
      {
        $project: {
          rank: { $add: ['$targetUserIndex', 1] },
        },
      },
    ];

    const result = await this.userPointModel.aggregate(pipeline);
    const rank = result.length > 0 ? result[0].rank : undefined;
    return new BaseResult(rank);
  }
}
