import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../notificaciones/schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async createMany(userId: Types.ObjectId, items: { title: string; message: string }[]) {
    const docs = items.map((n) => ({ userId, ...n, read: false }));
    await this.notificationModel.insertMany(docs);
  }

  async getByUser(userId: string) {
    const objectId = new Types.ObjectId(userId); 
    return this.notificationModel
      .find({ userId: objectId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(id, { read: true }, { new: true });
  }

  async markAllAsRead(userId: string) {
    const objectId = new Types.ObjectId(userId);
    return this.notificationModel.updateMany({ userId: objectId, read: false }, { read: true });
  }
}