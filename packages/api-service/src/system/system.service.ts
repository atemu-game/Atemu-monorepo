import { InjectModel } from '@nestjs/mongoose';
import configuration from '@app/shared/configuration';
import { ConfigurationName } from '@app/shared/constants/setting';
import { Injectable, BadRequestException } from '@nestjs/common';
import { Configuration } from '@app/shared/models';
import { Model } from 'mongoose';
@Injectable()
export class SystemService {
  constructor(
    @InjectModel(Configuration.name)
    private configurationModel: Model<Configuration>,
  ) {}

  async getDefaultRPC() {
    try {
      const data = await this.configurationModel.findOne({
        configName: ConfigurationName.LIST_PUBLIC_RPC,
        chainName: configuration().CHAIN_ID,
      });
      return data;
    } catch (error) {
      throw new BadRequestException('Error when get default RPC');
    }
  }
}
