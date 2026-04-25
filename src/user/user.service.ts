import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { CreateUserDto } from './dto/createUserDto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }

  async register(userData: CreateUserDto) {
    const exists = await this.userModel.findOne({ email: userData.email });

    if (exists) {
      throw new ConflictException('Este email ya se encuentra registrado.');
    }

    if (!userData.password) {
      throw new ConflictException('La contraseña es requerida.');
    }

    //Encriptación de la contraseña

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new this.userModel({
      email: userData.email,
      password: hashedPassword, //
      firstname: userData.firstname,
      lastname: userData.lastname,
      role: userData.role || 'consultor',
      estado: true,
    });

    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return {
      message: 'Usuario registrado correctamente.',
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.userModel
          .find({ estado: true })
          .select('-password')
          .skip(skip)
          .limit(limit)
          .lean(),

        this.userModel.countDocuments({ estado: true }),
      ]);
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
