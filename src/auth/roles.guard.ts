import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from 'src/auth/schemas/user.schema';
import { JwtPayload } from './type/jwtpayload';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
