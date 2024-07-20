import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { Document, SchemaTypes } from 'mongoose';
import { ChainDocument } from './chain.schema';
import { CardCollectionDocument } from './cardCollection.schema';
import { Attribute } from '@app/shared/types';

export type CardDocument = Cards & Document;

@Schema({ timestamps: true })
export class Cards extends BaseSchema {
  @Prop()
  cardId: string;

  @Prop()
  cardContract: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'CardCollections' })
  cardCollection: CardCollectionDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chains' })
  chain: ChainDocument;

  @Prop()
  blockTime: number;

  @Prop()
  name?: string;

  @Prop()
  image?: string;

  @Prop()
  originalImage?: string;

  @Prop()
  animationUrl?: string;

  @Prop()
  animationPlayType?: string;

  @Prop()
  externalUrl?: string;

  @Prop()
  description?: string;

  @Prop()
  tokenUri?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  creator?: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  owner: UserDocument;

  @Prop()
  amount: number;

  @Prop({ type: SchemaTypes.Array })
  attributes?: Attribute[];

  @Prop({ default: false })
  isBurned?: boolean;

  @Prop()
  burnedAt?: number;
}

export const CardSchema = SchemaFactory.createForClass(Cards);
CardSchema.index({ cardContract: 1, tokenId: 1 });
CardSchema.index({ owner: 1 });
CardSchema.index({ cardContract: 1, tokenId: 1, owner: 1 }, { unique: true });
