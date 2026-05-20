import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/auth/schemas/user.schema';
import { VerificationCode, VerificationCodeSchema } from '../auth/schemas/verification-code.schema';
import { MailModule } from '../email/mail.module';
import { NotificationModule } from 'src/notificaciones/notification.module';
import { AuthModule } from 'src/auth/auth.module';
import { Notification, NotificationSchema } from '../notificaciones/schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    MailModule,
    NotificationModule,
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}