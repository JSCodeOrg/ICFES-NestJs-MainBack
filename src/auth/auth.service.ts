import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user || !user.password) return null;

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return {
        id: user._id,
        email: user.email,
        role: user.role,
        estado: user.estado,
        firstname: user.firstname,
        lastname: user.lastname,
        lastLogin: user.lastLogin,
      };
    }

    return null;
  }

  async login(credentials: { email: string; password: string }) {
    const user = await this.validateUser(credentials.email, credentials.password);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.estado) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    await this.userModel.findByIdAndUpdate(user.id, {lastLogin: new Date()});

    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginWithGoogle(googleUser: {
    email: string;
    firstname: string;
    lastname: string;
    picture?: string;
  }) {
    let user = await this.userModel.findOne({ email: googleUser.email });

    if (!user) {
      user = await this.userModel.create({
        email: googleUser.email,
        firstname: googleUser.firstname,
        lastname: googleUser.lastname,
        estado: true,
        role: 'consultor',
      });
    }

    if (!user.estado) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const payload = {
      email: user.email,
      id: user._id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getMe(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload) {
        const user = await this.userModel.findById(payload.id);

        if (!user) {
          throw new UnauthorizedException('Token no reconocido o no válido.');
        }

        return {
          id: user._id,
          email: user.email,
          role: user.role,
          firstname: user.firstname ?? '',
          lastname: user.lastname ?? '',
          lastLogin: user.lastLogin ?? null,
        };
      }
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
