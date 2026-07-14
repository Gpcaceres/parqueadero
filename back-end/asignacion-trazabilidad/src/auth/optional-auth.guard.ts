import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedUser {
  id_user: string;
  username: string;
  roles: string[];
}

/**
 * Verifica el JWT emitido por el microservicio de personas si viene en el
 * header Authorization, y adjunta el usuario decodificado a la request.
 * NUNCA rechaza la petición (no es un guard de autorización): si no hay
 * token, o es inválido/expirado, la request sigue sin autenticar
 * (request.user queda undefined). Esto mantiene los endpoints de
 * asignaciones abiertos como hoy, pero permite saber "quién" realizó cada
 * acción cuando sí se manda un token, para poblar la auditoría.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const payload = this.jwtService.verify(token);
        request.user = {
          id_user: payload.sub,
          username: payload.username,
          roles: payload.roles || [],
        } as AuthenticatedUser;
      } catch {
        // Token inválido o expirado: se ignora, la request sigue sin autenticar.
      }
    }

    return true;
  }
}
