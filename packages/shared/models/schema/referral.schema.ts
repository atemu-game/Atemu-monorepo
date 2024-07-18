import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from './base.schema';
import { SchemaTypes } from 'mongoose';
import { TypeOfInviteCode } from '@app/shared/constants';
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
  name?: string;
  @Prop()
  description?: string;

  @Prop()
  referralCode: string;

  @Prop({ type: SchemaTypes.String, enum: TypeOfInviteCode })
  kindInviteCode: TypeOfInviteCode;

  @Prop({ default: 0 })
  amountActive: number;

  @Prop()
  availableAt: number;

  @Prop()
  expiredDate: number;
}
export const ReferralSchema = SchemaFactory.createForClass(Referrals);

ReferralSchema.index({ address: 1, referralCode: 1 }, { unique: true });
