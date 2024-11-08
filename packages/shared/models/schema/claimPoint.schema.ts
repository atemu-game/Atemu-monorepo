import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document } from 'mongoose';

export type ClaimPointDocument = ClaimPoint & Document;
@Schema({ timestamps: true })
export class ClaimPoint extends BaseSchema {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true, default: 0 })
  agePoints: number;

  @Prop({ required: true, default: false })
  isClaimed: boolean;

  claimDate?: string;
}

export const ClaimPointSchema = SchemaFactory.createForClass(ClaimPoint);

ClaimPointSchema.index({ address: 1 }, { unique: true });
