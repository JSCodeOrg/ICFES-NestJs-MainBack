import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin') 
  getAdminData() {
    return { message: 'felicidades eres admin' };
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  getProfile() {
    return { message: 'Adelante asalariado' };
  }
}