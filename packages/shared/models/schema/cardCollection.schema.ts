import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { UserDocument } from './user.schema';
import { ChainDocument } from './chain.schema';
import { PaymentTokenDocument } from './paymenttoken.schema';
import { Document, SchemaTypes } from 'mongoose';
import { AttributeMap, CardCollectionStandard } from '@app/shared/types';

export type CardCollectionDocument = CardCollections & Document;

@Schema({ timestamps: true })
export class CardCollections extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  symbol: string;

  @Prop()
  key?: string;

  @Prop()
  cardContract: string;

  @Prop()
  cover?: string;

  @Prop()
  avatar?: string;

  @Prop()
  featuredImage?: string;

  @Prop()
  description?: string;

  @Prop()
  contractUri?: string;

  @Prop()
  attributesMap?: AttributeMap[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  owner?: UserDocument;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Chains' })
  chain: ChainDocument;

  @Prop({ type: SchemaTypes.String, enum: CardCollectionStandard })
  standard: CardCollectionStandard;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'PaymentTokens' })
  paymentTokens: PaymentTokenDocument[];
}

export const cardCollectionSchema =
  SchemaFactory.createForClass(CardCollections);
cardCollectionSchema.index({ cardContract: 1 }, { unique: true });
