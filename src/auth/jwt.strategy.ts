import { Injectable } from '@nestjs/common'; 
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.token, // leer la cookie para verificar rol eh infomarcion ;)
      ]),
      secretOrKey: 'SECRET_KEY',
    });
  }

  async validate(payload: any) {
    return payload;
  }
}