import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedUser {
  id_user: string;
  username: string;
  roles: string[];
}

/**
 * Rechaza la petición (401) si no hay token Bearer válido. Los registros de
 * auditoría son datos sensibles (quién hizo qué, IPs, etc.), así que a
 * diferencia de otros servicios este no tiene una variante "opcional": todo
 * lo que exponga este controller requiere autenticación.
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
