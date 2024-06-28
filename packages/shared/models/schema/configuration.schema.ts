import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigurationDocument = Configuration & Document;

@Schema({
  collection: 'configurations',
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
export class Configuration {
  @Prop({ unique: true })
  key: string;
  @Prop()
  value: string;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);
