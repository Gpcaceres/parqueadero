import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './optional-auth.guard';

/**
 * A diferencia de OptionalAuthGuard, este SÍ rechaza la petición (401) si no
 * hay token, o es inválido/expirado. Se usa en los endpoints que mutan datos.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Se requiere un token de autenticación');
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = this.jwtService.verify(token);
      request.user = {
        id_user: payload.sub,
        username: payload.username,
        roles: payload.roles || [],
      } as AuthenticatedUser;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }
}
