import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Service: Zone Integration
 * Comunicación con el microservicio de zonas/espacios
 *
 * Responsabilidades:
 * - Validar espacios en zonas
 * - Obtener detalles de zonas
 * - Integrar información de estacionamiento con asignaciones
 */
@Injectable()
export class ZoneIntegrationService {
  private readonly logger = new Logger(ZoneIntegrationService.name);
  private readonly zoneServiceUrl = process.env.ZONE_SERVICE_URL || 'http://zonas:8080';

  constructor(private httpService: HttpService) {}

  /**
   * Obtener detalles de una zona desde el microservicio
   *
   * @param zoneId ID de la zona
   * @returns Detalles de la zona o null si no existe
   */
  async getZoneDetails(zoneId: string) {
    try {
      this.logger.debug(`Obteniendo detalles de la zona ${zoneId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.zoneServiceUrl}/api/zonas/${zoneId}`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener detalles de la zona ${zoneId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Obtener disponibilidad de espacios en una zona
   *
   * @param zoneId ID de la zona
   * @returns Información de disponibilidad
   */
  async getZoneAvailability(zoneId: string) {
    try {
      this.logger.debug(`Obteniendo disponibilidad de la zona ${zoneId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.zoneServiceUrl}/api/zonas/${zoneId}/disponibilidad`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Error obteniendo disponibilidad: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Obtener espacios de una zona
   *
   * @param zoneId ID de la zona
   * @returns Array de espacios
   */
  async getZoneSpaces(zoneId: string) {
    try {
      this.logger.debug(`Obteniendo espacios de la zona ${zoneId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.zoneServiceUrl}/api/zonas/${zoneId}/espacios`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Error obteniendo espacios de zona: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Obtener todas las zonas disponibles
   *
   * @returns Array de zonas
   */
  async getAllZones() {
    try {
      this.logger.debug('Obteniendo todas las zonas');

      const response = await firstValueFrom(
        this.httpService.get(`${this.zoneServiceUrl}/api/zonas`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Error obteniendo zonas: ${error.message}`);
      return [];
    }
  }

  /**
   * Verificar si una zona existe
   *
   * @param zoneId ID de la zona
   * @returns true si existe
   */
  async zoneExists(zoneId: string): Promise<boolean> {
    const zone = await this.getZoneDetails(zoneId);
    return !!zone;
  }

  /**
   * Obtener estadísticas de una zona
   *
   * @param zoneId ID de la zona
   * @returns Estadísticas de la zona
   */
  async getZoneStatistics(zoneId: string) {
    try {
      this.logger.debug(`Obteniendo estadísticas de la zona ${zoneId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.zoneServiceUrl}/api/zonas/${zoneId}/estadisticas`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Error obteniendo estadísticas: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Obtener historial de ocupación de una zona
   *
   * @param zoneId ID de la zona
   * @param days Número de días a consultar
   * @returns Historial de ocupación
   */
  async getZoneOccupancyHistory(zoneId: string, days: number = 7) {
    try {
      this.logger.debug(
        `Obteniendo historial de ocupación de ${days} días para zona ${zoneId}`,
      );

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.zoneServiceUrl}/api/zonas/${zoneId}/historial?dias=${days}`,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Error obteniendo historial: ${error.message}`);
      return null;
    }
  }

  /**
   * Health check del servicio de zonas
   *
   * @returns true si está disponible
   */
  async checkZoneServiceHealth(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.zoneServiceUrl}/actuator/health`),
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Servicio de zonas no disponible: ${error.message}`,
      );
      return false;
    }
  }
}
