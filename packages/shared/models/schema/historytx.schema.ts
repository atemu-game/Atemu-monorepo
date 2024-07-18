import { SchemaTypes } from 'mongoose';
import { BaseSchema } from './base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserDocument } from './user.schema';

import { PaymentTokenDocument } from './paymenttoken.schema';
import { HistoryTxType } from '@app/shared/constants/setting';
@Schema({
  timestamps: true,
})
export class HistoryTx extends BaseSchema {
  @Prop()
  txHash: string;

  @Prop()
  index: number;

  @Prop()
  cardAddress?: string;

  @Prop()
  cardId?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  from: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  to?: UserDocument;

  @Prop()
  amountPoints: number;

  @Prop()
  amountCards: number;

  @Prop()
  timestamp: number;

  @Prop({ type: SchemaTypes.String, enum: HistoryTxType })
  type: HistoryTxType;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentTokens' })
  paymentToken?: PaymentTokenDocument;
}

export const HistoryTxChema = SchemaFactory.createForClass(HistoryTx);
HistoryTxChema.index({ txHash: 1, index: 1 }, { unique: true });
