import { InjectModel } from '@nestjs/mongoose';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { LeaderBoardFilterParams } from './types';
import { UserPointsDTO } from '@app/shared/models/dtos/userpoints.dto';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import { formattedContractAddress } from '@app/shared/utils';
import { UserDocument, Users } from '@app/shared/models';
@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Users.name)
    private userPointModel: Model<UserDocument>,
  ) {}
  async getLeaderboard(query: LeaderBoardFilterParams) {
    const result = new BaseResultPagination<UserPointsDTO>();
    const filter: any = {};

    const count = await this.userPointModel.countDocuments(filter);
    if (query.size === 0) {
      result.data = new PaginationDto([], count, query.page, query.size);
      return result;
    }
    const items = await this.userPointModel.find(
      filter,
      {
        address: 1,
        points: 1,
        updatedAt: 1,
        avatar: 1,
        isVerified: 1,
        username: 1,
        createdAt: 1,
      },
      {
        sort: { points: -1, createdAt: 1 },
        skip: query.skipIndex,
        limit: query.size,
      },
    );

    result.data = new PaginationDto(items, count, query.page, query.size);
    return result;
  }

  async getLeaderboardByAddress(address: string) {
    const formataddress = formattedContractAddress(address);

    const result = await this.userPointModel.aggregate([
      {
        $sort: { points: -1, createdAt: 1 },
      },
      {
        $group: {
          _id: null,
          users: { $push: '$$ROOT' },
        },
      },
      {
        $unwind: {
          path: '$users',
          includeArrayIndex: 'rank',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$users', { rank: { $add: ['$rank', 1] } }],
          },
        },
      },
      { $match: { address: formataddress } },
      { $project: { _id: 0, address: 1, points: 1, rank: 1 } },
    ]);

    const rank = result.length > 0 ? result[0].rank : undefined;
    return new BaseResult(rank);
  }
}
