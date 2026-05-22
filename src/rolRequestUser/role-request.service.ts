import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RoleRequest, RoleRequestDocument } from './schemas/role-request.schema';
import { User } from '../auth/schemas/user.schema';
import { CreateRoleRequestDto } from './dto/create-role-request.dto';

@Injectable()
export class RoleRequestService {
  constructor(
    @InjectModel(RoleRequest.name)
    private readonly roleRequestModel: Model<RoleRequestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>, 
  ) {}

  async create(userId: string, userEmail: string, userName: string, currentRole: string, dto: CreateRoleRequestDto) {
    const existing = await this.roleRequestModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'pending',
    });
    if (existing) throw new ConflictException('Ya tienes una solicitud de cambio de rol pendiente.');
    if (dto.requestedRole === currentRole) throw new ConflictException('Ya tienes ese rol asignado.');

    const request = await this.roleRequestModel.create({
      userId: new Types.ObjectId(userId),
      userEmail,
      userName,
      currentRole,
      requestedRole: dto.requestedRole,
      reason: dto.reason ?? '',
      status: 'pending',
    });

    return { message: 'Solicitud enviada correctamente.', request };
  }

  async findAll() {
    return this.roleRequestModel.find().sort({ createdAt: -1 }).lean();
  }

  async findPending() {
    return this.roleRequestModel.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
  }

  async findByUser(userId: string) {
    return this.roleRequestModel
      .findOne({ userId: new Types.ObjectId(userId), status: 'pending' })
      .lean();
  }

  async resolve(requestId: string, status: 'approved' | 'rejected') {
    const request = await this.roleRequestModel.findById(requestId);
    if (!request) throw new NotFoundException('Solicitud no encontrada.');
    if (request.status !== 'pending') throw new ConflictException('Esta solicitud ya fue procesada.');

    request.status = status;
    await request.save();

    if (status === 'approved') {
      await this.userModel.findByIdAndUpdate(request.userId, { role: request.requestedRole });
    }

    return {
      message: status === 'approved' ? 'Solicitud aprobada y rol asignado.' : 'Solicitud rechazada.',
      request,
    };
  }
}