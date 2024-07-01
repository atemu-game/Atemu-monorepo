import { ChainName, ConfigurationName } from '@app/shared/constants/setting';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document } from 'mongoose';

export type ConfigurationDocument = Configuration & Document;

@Schema({
  collection: 'configurations',
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Configuration {
  @IsEnum(ConfigurationName)
  @Prop()
  configName: ConfigurationName;

  @IsEnum(ChainName)
  @Prop()
  chainName: ChainName;

  @Prop()
  value: string[];
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);

ConfigurationSchema.index({ key: 1, chainKey: 1 }, { unique: true });
