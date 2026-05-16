import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/auth/schemas/user.schema';

import { VerificationCode, VerificationCodeSchema } from '../auth/schemas/verification-code.schema';
import { MailModule } from '../email/mail.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: VerificationCode.name, schema: VerificationCodeSchema }, ]), MailModule,],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
