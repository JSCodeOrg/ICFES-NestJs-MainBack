import { Body, Controller, Post, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/createUserDto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 409, description: 'Este email ya se encuentra registrado.' })
  register(@Body() body: CreateUserDto) {
    return this.userService.register(body);
  }

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
