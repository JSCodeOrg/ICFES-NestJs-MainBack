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
      };
    }

    return null;
  }

  async login(credentials: { email: string; password: string }) {
    const user = await this.validateUser(
      credentials.email,
      credentials.password,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.estado) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
