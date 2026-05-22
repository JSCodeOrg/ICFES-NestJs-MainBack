import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleRequest, RoleRequestSchema } from './schemas/role-request.schema';
import { RoleRequestService } from './role-request.service';
import { RoleRequestController } from './role-request.controller';
import { User, UserSchema } from '../auth/schemas/user.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoleRequest.name, schema: RoleRequestSchema },
      { name: User.name, schema: UserSchema }, 
    ]),
  ],
  controllers: [RoleRequestController],
  providers: [RoleRequestService],
})
export class RoleRequestModule {}