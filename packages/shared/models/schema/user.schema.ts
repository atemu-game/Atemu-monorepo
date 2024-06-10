import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from './base.schema';

export type UserDocument = Users & Document;

// export class Socials {
//   facebook: string;
//   twitter: string;
//   telegram: string;
//   discord: string;
//   website: string;
// }

@Schema({
  timestamps: true,
})
export class Users extends BaseSchema {
  @Prop({ unique: true })
  username: string;

  @Prop()
  email?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  emailVerified?: boolean;

  @Prop({ required: true })
  address: string;

  @Prop()
  privateKey?: string;
  @Prop()
  deployHash?: string;

  @Prop({ type: SchemaTypes.UUID })
  nonce: string;

  @Prop({ default: false })
  isVerified?: boolean;

  @Prop({ default: false })
  isCreatorAccount?: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Users' })
  mappingAddress?: UserDocument;

  @Prop()
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(Users);
