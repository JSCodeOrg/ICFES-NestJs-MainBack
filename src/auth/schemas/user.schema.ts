import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'usuarios' })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop()
  password: string;

  @Prop()
  firstname: string;

  @Prop()
  lastname: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
