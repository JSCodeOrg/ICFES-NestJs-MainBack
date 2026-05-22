import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleRequestDocument = RoleRequest & Document;

export type RequestStatus = 'pending' | 'approved' | 'rejected';

@Schema({ collection: 'role_requests', timestamps: true })
export class RoleRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  currentRole: string;

  @Prop({ required: true })
  requestedRole: string;

  @Prop({ required: false, default: '' })
  reason: string;

  @Prop({ required: true, default: 'pending' })
  status: RequestStatus;
}

export const RoleRequestSchema = SchemaFactory.createForClass(RoleRequest);