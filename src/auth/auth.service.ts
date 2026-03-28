import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return {
        id: user._id,
        email: user.email,
      };
    }

    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role, //tomar el rol cuando se genere el token
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
