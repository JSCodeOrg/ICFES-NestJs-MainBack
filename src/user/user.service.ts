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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { NotificationService } from 'src/notificaciones/notification.service';
import { JwtService } from '@nestjs/jwt';
import { Notification } from 'src/notificaciones/schemas/notification.schema';



@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(VerificationCode.name) private readonly verificationCodeModel: Model<VerificationCode>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
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
    await this.notificationService.createMany(user._id, [

      {
        title: '¡Bienvenido al dashboard icfes!',
        message: 'Nos alegra tenerte aquí. Explora todas las funcionalidades disponibles.',
      },
      {
        title: 'Completa tu perfil',
        message: 'Agrega tu nombre y apellido en la seccion del perfil para completar el registro..',
      },
    ]);

    const access_token = this.jwtService.sign({
      email: user.email,
      id: user._id,
      role: user.role,
    });

    const saved = await this.notificationModel.find({ userId: user._id });
    console.log("Notificaciones guardadas ", saved.length);


    return { access_token, message: 'Correo verificado. Usuario registrado correctamente.' };
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

  async updateProfile(id: string, dto:UpdateProfileDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new ConflictException("Usuario no encontrado");

    user.firstname = dto.firstname;
    user.lastname = dto.lastname;
    await user.save();

    return { message: 'Perfil actualizado correctamente'};
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.userModel.findById(id);
    if(!user) throw new ConflictException('Usuario no encontrado');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if(!isMatch) throw new BadRequestException('La contraseña actual es incorrecta');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Contraseña actualizada correctamente'}

  }
}
