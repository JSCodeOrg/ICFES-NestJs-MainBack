import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'usuarios', timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    required: false,
  })
  firstname: string;

  @Prop({
    required: false,
  })
  lastname: string;

  @Prop({
    required: true,
  })
  role: string;

  @Prop({
    required: true,
    default: true,
  })
  estado: boolean;

  @Prop({
    required: false,
    default: null
  })
  lastLogin:Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
