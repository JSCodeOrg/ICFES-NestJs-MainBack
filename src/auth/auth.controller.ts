import { Controller, Post, Body, UnauthorizedException, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const user = await this.authService.validateUser(
      body.email,
      body.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectasm ¿Quien sos vos?');
    }

    const { access_token } = await this.authService.login(user);

    res.cookie('token', access_token, {
      httpOnly: true,      
      secure: false,        
      sameSite: 'lax',      
      maxAge: 1000 * 60 * 60, 
    });

    return res.json({
      Message: 'Entre socio, por la sombrita',
    });

  }
}