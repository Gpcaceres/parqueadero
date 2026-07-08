import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

  constructor(private readonly httpService: HttpService) {}

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
        this.httpService.put(`${this.zoneServiceUrl}/api/v1/espacios/${idEspacio}`, {
          idZona: espacio.idZona,
          descripcion: espacio.descripcion,
          tipo: espacio.tipo,
          estado,
        }),
      );
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
}
