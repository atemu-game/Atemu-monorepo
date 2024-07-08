import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
export type ChainDocument = Chains & Document;

@Schema({ timestamps: true })
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
}

export const ChainSchema = SchemaFactory.createForClass(Chains);
