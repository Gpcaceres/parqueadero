import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Service: Vehicle Integration
 * Comunicación con el microservicio de vehículos
 *
 * RF3: Integración con Microservicio de Vehículos
 * - Obtener detalles de vehículos
 * - Validar existencia de vehículos
 * - Enriquecer respuestas con información del vehículo
 */
@Injectable()
export class VehicleIntegrationService {
  private readonly logger = new Logger(VehicleIntegrationService.name);
  private readonly vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://vehiculos:3000';

  constructor(private httpService: HttpService) {}

  /**
   * Obtener detalles de un vehículo desde el microservicio
   *
   * @param vehicleId ID del vehículo
   * @returns Detalles del vehículo o null si no existe
   */
  async getVehicleDetails(vehicleId: string) {
    try {
      this.logger.debug(`Obteniendo detalles del vehículo ${vehicleId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.vehicleServiceUrl}/api/vehiculos/${vehicleId}`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener detalles del vehículo ${vehicleId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Obtener varios vehículos por IDs
   *
   * @param vehicleIds Array de IDs de vehículos
   * @returns Array de vehículos
   */
  async getVehiclesDetails(vehicleIds: string[]) {
    try {
      this.logger.debug(`Obteniendo detalles de ${vehicleIds.length} vehículos`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.vehicleServiceUrl}/api/vehiculos/batch`, {
          ids: vehicleIds,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Error obteniendo lote de vehículos: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Verificar si un vehículo existe
   *
   * @param vehicleId ID del vehículo
   * @returns true si existe, false en caso contrario
   */
  async vehicleExists(vehicleId: string): Promise<boolean> {
    const vehicle = await this.getVehicleDetails(vehicleId);
    return !!vehicle;
  }

  /**
   * Obtener vehículos por tipo
   *
   * @param type Tipo de vehículo (Moto, Automóvil, etc.)
   * @returns Array de vehículos del tipo especificado
   */
  async getVehiclesByType(type: string) {
    try {
      this.logger.debug(`Obteniendo vehículos de tipo ${type}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.vehicleServiceUrl}/api/vehiculos/tipo/${type}`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Error obteniendo vehículos por tipo: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtener vehículos por categoría
   *
   * @param category Categoría (Eléctrico, Híbrido, Combustión)
   * @returns Array de vehículos de la categoría
   */
  async getVehiclesByCategory(category: string) {
    try {
      this.logger.debug(`Obteniendo vehículos de categoría ${category}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.vehicleServiceUrl}/api/vehiculos/categoria/${category}`,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Error obteniendo vehículos por categoría: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Enriquecer asignación con detalles del vehículo
   *
   * @param assignment Asignación base
   * @returns Asignación con información del vehículo
   */
  async enrichAssignmentWithVehicle(assignment: any) {
    const vehicle = await this.getVehicleDetails(assignment.vehicleId);

    return {
      ...assignment,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            type: vehicle.type,
            category: vehicle.category,
            brand: vehicle.brand,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate,
            year: vehicle.year,
          }
        : null,
    };
  }

  /**
   * Enriquecer múltiples asignaciones con detalles de vehículos
   *
   * @param assignments Array de asignaciones
   * @returns Asignaciones con información de vehículos
   */
  async enrichAssignmentsWithVehicles(assignments: any[]) {
    const vehicleIds = assignments.map((a) => a.vehicleId);
    const vehicles = await this.getVehiclesDetails(vehicleIds);

    const vehicleMap = vehicles.reduce((map, vehicle) => {
      map[vehicle.id] = vehicle;
      return map;
    }, {});

    return assignments.map((assignment) => ({
      ...assignment,
      vehicle: vehicleMap[assignment.vehicleId] || null,
    }));
  }

  /**
   * Validar que todos los vehículos existen
   *
   * @param vehicleIds Array de IDs de vehículos
   * @returns true si todos existen, false en caso contrario
   */
  async validateVehiclesExist(vehicleIds: string[]): Promise<boolean> {
    if (vehicleIds.length === 0) return true;

    const vehicles = await this.getVehiclesDetails(vehicleIds);
    return vehicles.length === vehicleIds.length;
  }

  /**
   * Health check del servicio de vehículos
   *
   * @returns true si está disponible
   */
  async checkVehicleServiceHealth(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.vehicleServiceUrl}/health`),
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Servicio de vehículos no disponible: ${error.message}`,
      );
      return false;
    }
  }
}
