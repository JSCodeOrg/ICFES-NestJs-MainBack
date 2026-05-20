import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class VerificationCode extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, default: Date.now, expires: 600 })
  createdAt: Date;

  @Prop({ required: true })
    hashedPassword: string;
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);