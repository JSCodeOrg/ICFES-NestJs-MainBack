import { Body, Controller, Post, Get, Query, Patch, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/createUserDto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/jwt.decorator';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

import { Res } from '@nestjs/common';
import type { Response } from 'express';


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

  @Post('verify-email')
  @Public()
  async verifyEmail(@Body() body: VerifyEmailDto, @Res({ passthrough: true }) res: Response) {
    const { access_token } = await this.userService.verifyEmail(body);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

    return { message: 'Registro completado. Bienvenido.' };
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  getAdminData() {
    return { message: 'felicidades eres admin' };
  }

  @Get('users')
  @ApiOperation({ summary: 'Listado de usuarios con paginación', description: 'Devuelve el listado de usuarios paginados' })
  @ApiBearerAuth()
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

  @Patch('user/rol')
  @Roles('admin')
  UpdateUserRol(@Query('id') id: string, @Query('role') role: string) {
    return this.userService.updateUserRol(id, role);

  }

  @Patch('user/profile/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar nombre y apellido', description: 'Permite al usuario actualizar su firstname y lastname.'})
  @ApiResponse( { status: 200, description: 'Perfil actualizado correctamente.'})
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.'})
  updateProfile(@Param('id') id: string, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(id, body);
  }


  @Patch('user/password/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar contraseña', description: 'Requiere la contraseña actual y la nueva.' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente.' })
  @ApiResponse({ status: 400, description: 'La contraseña actual es incorrecta.' })
  updatePassword(@Param('id') id: string, @Body() body: UpdatePasswordDto) {
    return this.userService.updatePassword(id, body);
  }

}
