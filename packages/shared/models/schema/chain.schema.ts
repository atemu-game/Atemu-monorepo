import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { Document } from 'mongoose';
export type ChainDocument = Chains & Document;

@Schema({ timestamps: true, collection: 'chains' })
export class Chains extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  rpc: string;

  @Prop()
  delayBlock: number;

  @Prop()
  explore: string;

  @Prop()
  bliztContractAdress: string;

  @Prop()
  fuelContracts: string[];

  @Prop()
  cardsContract: string;
}

export const ChainSchema = SchemaFactory.createForClass(Chains);
