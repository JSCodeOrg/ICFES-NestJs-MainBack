import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { Public } from './jwt.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas ¿Quién sos vos?',);
    }

    const { access_token } = await this.authService.login({
      email: body.email,
      password: body.password,
    });

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    });

    return {
      message: 'Entre socio, por la sombrita',};
  }
}
