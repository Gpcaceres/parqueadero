import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';

/**
 * Resuelve el nombre completo de un usuario a partir de su id, para poder
 * mostrarlo en el ticket sin exponer el endpoint de personas al público.
 * GET /personas/:id exige autenticación (ver personas.controller.ts), así
 * que esta llamada es servicio-a-servicio: firma su propia identidad con el
 * mismo JWT_SECRET compartido, igual que ZoneIntegrationService con zonas.
 * No lanza si personas falla: se registra un warning y se devuelve null,
 * para que la consulta del ticket no se caiga por un problema de otro
 * servicio.
 */
@Injectable()
export class PersonaIntegrationService {
  private readonly logger = new Logger(PersonaIntegrationService.name);
  private readonly personaServiceUrl =
    process.env.USER_SERVICE_URL || 'http://personas:3001';

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  private serviceToken(): string {
    return this.jwtService.sign({
      sub: 'ms-tickets-service',
      username: 'ms-tickets-service',
      roles: ['admin'],
    });
  }

  async obtenerNombreCompleto(idUsuario: string): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.personaServiceUrl}/personas/${idUsuario}`, {
          headers: { Authorization: `Bearer ${this.serviceToken()}` },
        }),
      );
      const { first_name, last_name } = response.data;
      const nombre = [first_name, last_name].filter(Boolean).join(' ');
      return nombre || null;
    } catch (error: any) {
      this.logger.warn(
        `No se pudo obtener el nombre del usuario ${idUsuario}: ${error.message}`,
      );
      return null;
    }
  }
}
