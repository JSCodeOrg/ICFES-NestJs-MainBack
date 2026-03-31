import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from 'src/utils/jwt/jwtPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no definido en variables de entorno');
    }
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.cookies?.token]),
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    return payload; 
  }
}


