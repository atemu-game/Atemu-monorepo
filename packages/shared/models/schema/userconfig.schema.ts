import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from './base.schema';
export type UserConfigDocument = Document & UserConfig;

@Schema({
  collection: 'userconfigs',
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
export class UserConfig extends BaseSchema {
  @Prop({ unique: true })
  address: string;
  @Prop()
  rpcPublicStore: string[];
}

export const UserConfigSchema = SchemaFactory.createForClass(UserConfig);
