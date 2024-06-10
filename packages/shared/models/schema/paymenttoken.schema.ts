import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from './base.schema';

export type PaymentTokenDocument = PaymentTokens & Document;

@Schema({
  timestamps: true,
})
export class PaymentTokens extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  symbol: string;

  @Prop()
  decimals: number;

  @Prop()
  contractAddress: string;

  @Prop()
  enabled: boolean;

  @Prop()
  isNative: boolean; // ETH and STRK
}

export const PaymentTokenSchema = SchemaFactory.createForClass(PaymentTokens);
