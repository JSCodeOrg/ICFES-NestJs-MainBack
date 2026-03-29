import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';

type JwtPayload = {
  email: string;
  id: string;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.cookies?.token]),
      secretOrKey: 'SECRET_KEY',
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
