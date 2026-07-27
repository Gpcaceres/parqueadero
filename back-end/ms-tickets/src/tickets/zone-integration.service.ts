import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { SseService } from '../sse/sse.service';

/**
 * Service: Zone Integration
 * Sincroniza el estado del espacio (zonas) con el ciclo de vida del ticket:
 * - Al crear un ticket, el espacio pasa a OCUPADO.
 * - Al cerrar un ticket (salida/pagado o anulado), el espacio vuelve a
 *   DISPONIBLE.
 *
 * No lanza si el servicio de zonas falla: se registra un warning y el
 * ticket sigue su curso (igual que el resto de integraciones del sistema),
 * para no bloquear la operación principal por una falla de sincronización.
 */
@Injectable()
export class ZoneIntegrationService {
  private readonly logger = new Logger(ZoneIntegrationService.name);
  private readonly zoneServiceUrl =
    process.env.ZONE_SERVICE_URL || 'http://zonas:8080';

  constructor(
    private readonly httpService: HttpService,
    private readonly sseService: SseService,
    private readonly jwtService: JwtService,
  ) {}

  // PUT /espacios en zonas exige un token con rol admin/root/recaudador (ver
  // WriteAuthorizationFilter). Esta llamada es servicio-a-servicio, no viene
  // de un usuario logeado, así que ms-tickets firma su propia identidad de
  // sistema con el mismo JWT_SECRET compartido -- se ve en la auditoría como
  // "ms-tickets-service" con rol admin, no como un usuario real.
  private serviceToken(): string {
    return this.jwtService.sign({
      sub: 'ms-tickets-service',
      username: 'ms-tickets-service',
      roles: ['admin'],
    });
  }

  private async getEspacio(idEspacio: string): Promise<any | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.zoneServiceUrl}/api/v1/espacios/${idEspacio}`),
      );
      return response.data;
    } catch (error: any) {
      this.logger.warn(
        `No se pudo obtener el espacio ${idEspacio}: ${error.message}`,
      );
      return null;
    }
  }

  private async setEstadoEspacio(idEspacio: string, estado: string): Promise<void> {
    const espacio = await this.getEspacio(idEspacio);
    if (!espacio) {
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.zoneServiceUrl}/api/v1/espacios/${idEspacio}`,
          {
            idZona: espacio.idZona,
            descripcion: espacio.descripcion,
            tipo: espacio.tipo,
            estado,
          },
          { headers: { Authorization: `Bearer ${this.serviceToken()}` } },
        ),
      );

      // Notifica en tiempo real al dashboard vía SSE que el espacio cambió de
      // estado, para que refresque la tarjeta sin esperar al polling.
      this.sseService.emitEvent('Espacio actualizado', {
        id: idEspacio,
        estado,
      });
    } catch (error: any) {
      this.logger.warn(
        `No se pudo actualizar el espacio ${idEspacio} a ${estado}: ${error.message}`,
      );
    }
  }

  async marcarOcupado(idEspacio: string): Promise<void> {
    await this.setEstadoEspacio(idEspacio, 'OCUPADO');
  }

  async marcarDisponible(idEspacio: string): Promise<void> {
    await this.setEstadoEspacio(idEspacio, 'DISPONIBLE');
  }

  async marcarReservado(idEspacio: string): Promise<void> {
    await this.setEstadoEspacio(idEspacio, 'RESERVADO');
  }

  // Usado por ReservasService.crearReserva para validar que el espacio
  // exista y esté DISPONIBLE antes de reservarlo. Devuelve null si el
  // espacio no existe o si zonas no responde (mismo criterio tolerante que
  // el resto de esta clase).
  async obtenerEstado(idEspacio: string): Promise<string | null> {
    const espacio = await this.getEspacio(idEspacio);
    return espacio?.estadoEspacio ?? null;
  }

  // Usado por ReciboService para mostrar el código legible del espacio
  // (ej. "ZONA-1") en el recibo PDF en vez del UUID crudo que trae el ticket.
  async obtenerCodigo(idEspacio: string): Promise<string | null> {
    const espacio = await this.getEspacio(idEspacio);
    return espacio?.codigo ?? null;
  }

  // Usado por el job de expiración de reservas: solo libera el espacio si
  // SIGUE reservado -- si el personal ya generó el ticket real antes de que
  // venciera la reserva, el espacio ya está OCUPADO y esto no debe tocarlo.
  async liberarSiReservado(idEspacio: string): Promise<void> {
    const estadoActual = await this.obtenerEstado(idEspacio);
    if (estadoActual === 'RESERVADO') {
      await this.marcarDisponible(idEspacio);
    }
  }
}
