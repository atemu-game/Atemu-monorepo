import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';
import { CardCollectionDocument } from './cardCollection.schema';

export type FuelPoolDocument = FuelPool & Document;

@Schema({ timestamps: true })
export class FuelPool extends BaseSchema {
  @Prop()
  id: number;

  @Prop()
  address: string;

  @Prop()
  startAt: number;

  @Prop()
  endAt: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users', default: null })
  winner?: UserDocument;

  @Prop()
  cardId?: string;

  @Prop()
  cardContract?: string;

  @Prop()
  amountOfCards?: number;
  @Prop()
  totalPoints?: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'CardCollections' })
  cardCollection?: CardCollectionDocument;

  @Prop({ default: false })
  isClaimed?: boolean;

  @Prop({ default: false })
  isCanceled?: boolean;
}

export const FuelPoolSchema = SchemaFactory.createForClass(FuelPool);
FuelPoolSchema.index({ id: 1, address: 1 }, { unique: true });
