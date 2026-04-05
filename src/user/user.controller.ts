import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/createUserDto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/jwt.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  @Public()
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

  @Get('users')
  @ApiOperation({ summary: 'Listado de usuarios con paginación', description: 'Devuelve el listado de usuarios paginados' })
  @ApiResponse({ status: 200, description: 'Listado de usuarios' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @Roles('admin')
  getUsers(@Query('page') page: number, @Query('limit') limit: number) {
    return this.userService.getAllUsers(page, limit);
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  getProfile() {
    return { message: 'Adelante asalariado' };
  }
}
