import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'usuarios' })
export class User {
  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  role: String;
}

export const UserSchema = SchemaFactory.createForClass(User);