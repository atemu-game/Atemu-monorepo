import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';

export type UserPointsDocument = UserPoints & Document;
@Schema({
  collection: 'userpoints',
  timestamps: true,
})
export class UserPoints extends BaseSchema {
  @Prop({ unique: true })
  address: string;
  @Prop({ default: 0 })
  points: number;
}

export const UserPointsSchema = SchemaFactory.createForClass(UserPoints);
