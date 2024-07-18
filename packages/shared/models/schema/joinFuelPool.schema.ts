import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { FuelPoolDocument } from './fuelPool.schema';
import { Document, SchemaTypes } from 'mongoose';
import { UserDocument } from './user.schema';

export type JoinFuelPoolDocument = JoinFuelPool & Document;

@Schema({ timestamps: true })
export class JoinFuelPool extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'FuelPool' })
  pool: FuelPoolDocument;

  @Prop()
  poolId: number;

  @Prop()
  poolContract: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  user: UserDocument;

  @Prop()
  stakedAmount: number;
}

export const JoinFuelPoolSchema = SchemaFactory.createForClass(JoinFuelPool);
JoinFuelPoolSchema.index(
  { poolId: 1, poolContract: 1, user: 1 },
  { unique: true },
);
