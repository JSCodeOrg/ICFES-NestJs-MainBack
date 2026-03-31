import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './schemas/user.schema';
import { JwtStrategy } from '../utils/jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwtauthguard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule { }