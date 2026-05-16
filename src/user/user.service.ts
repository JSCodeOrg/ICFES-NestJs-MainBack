import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { VerificationCode } from '../auth/schemas/verification-code.schema';
import { CreateUserDto } from './dto/createUserDto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MailService } from '../email/mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(VerificationCode.name) private readonly verificationCodeModel: Model<VerificationCode>,
    private readonly mailService: MailService,
  ) {}

  async register(userData: CreateUserDto) {
    const exists = await this.userModel.findOne({ email: userData.email });
    if (exists) throw new ConflictException('Este email ya se encuentra registrado.');

    if (!userData.password || userData.password.trim() === '') {
      throw new ConflictException('La contraseña es requerida.');
    }

    await this.verificationCodeModel.deleteMany({ email: userData.email });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(userData.password, 10); // ← hashear aquí

    await this.verificationCodeModel.create({
      email: userData.email,
      code,
      hashedPassword,
    });

    await this.mailService.sendVerificationCode(userData.email, code);

    return { message: 'Código de verificación enviado. Revisa tu correo.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const record = await this.verificationCodeModel.findOne({ email: dto.email });

    if (!record) throw new BadRequestException('No hay un código pendiente para este correo.');
    if (record.code !== dto.code) throw new BadRequestException('Código incorrecto.');

    await this.verificationCodeModel.deleteOne({ _id: record._id });

    const user = new this.userModel({
      email: record.email,
      password: record.hashedPassword,
      role: 'consultor',
      estado: true,
    });

    await user.save();
    return { message: 'Correo verificado. Usuario registrado correctamente.' };
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([this.userModel.find({ estado: true }).select('-password').skip(skip).limit(limit).lean(), this.userModel.countDocuments({ estado: true })]);
      return {
        data: users,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  async updateUserRol(id: string, role: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new ConflictException('Usuario no encontrado.');
      }
      user.role = role;
      await user.save();
      return {
        message: 'Rol de usuario actualizado correctamente.',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
