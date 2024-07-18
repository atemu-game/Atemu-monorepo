import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
export type ReferralsDocument = Document & Referrals;
@Schema({
  collection: 'referrals',
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Referrals extends BaseSchema {
  @Prop()
  address: string;

  @Prop()
  referralCode: string;

  @Prop({ default: 0 })
  amountActive: number;

  @Prop()
  expiredDate: number;
}
export const ReferralSchema = SchemaFactory.createForClass(Referrals);

ReferralSchema.index({ address: 1, referralCode: 1 }, { unique: true });
