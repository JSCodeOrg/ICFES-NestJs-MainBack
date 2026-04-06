import { Controller, Post, Body, UnauthorizedException, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/loginDto';
import { Public } from './jwt.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login del usuario', description: 'Devuelve el JWT del usuario a través de las cookies.' })
  @ApiResponse({ status: 200, description: 'Entre socio, por la sombrita.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas, ¿Quién sos vos?' })
  @Public()
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas ¿Quién sos vos?');
    }

    const { access_token } = await this.authService.login(body);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    });

    return {
      message: 'Entre socio, por la sombrita',
    };
  }
}
