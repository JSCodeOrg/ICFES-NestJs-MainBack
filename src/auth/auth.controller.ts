import { Controller, Post, Body, UnauthorizedException, Res, HttpCode, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/loginDto';
import { Public } from './jwt.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';

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
      path: '/',
    });

    return {
      message: 'Entre socio, por la sombrita',
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Verificación del usuario', description: 'Verifica quien es el usuario y valida que su sesión continúe con vida.' })
  @ApiResponse({ status: 201, description: 'La sesión del usuario es válida.' })
  @ApiResponse({ status: 401, description: 'La sesión del usuario expiró.' })
  async checkSession(@Req() req: Request) {
    const token = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('No autenticado');
    }

    return this.authService.getMe(token);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Cierre de sesión',
    description: 'Cierra la sesión del usuario',
  })
  @ApiResponse({
    status: 204,
    description: 'Sesión cerrada correctamente',
  })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

@Get('google')
@Public()
@UseGuards(GoogleAuthGuard)
async googleAuth() {
  
}

@Get('google/callback')
@Public()
@UseGuards(GoogleAuthGuard)
async googleCallback(@Req() req: Request | any, @Res() res: Response) {
  const { access_token } = await this.authService.loginWithGoogle(req.user);

  res.cookie('token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60,
    path: '/',
  });

  res.redirect(`${process.env.FRONTEND_URL}/home`);
}

}
