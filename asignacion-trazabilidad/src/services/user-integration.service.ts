import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Service: User Integration
 * Comunicación con el microservicio de usuarios/personas
 *
 * Responsabilidades:
 * - Validar existencia de usuarios
 * - Obtener detalles de usuarios
 * - Enriquecer respuestas con información del usuario
 */
@Injectable()
export class UserIntegrationService {
  private readonly logger = new Logger(UserIntegrationService.name);
  private readonly userServiceUrl = process.env.USER_SERVICE_URL || 'http://personas:3001';

  constructor(private httpService: HttpService) {}

  /**
   * Obtener detalles de un usuario desde el microservicio
   *
   * @param userId ID del usuario
   * @returns Detalles del usuario o null si no existe
   */
  async getUserDetails(userId: string) {
    try {
      this.logger.debug(`Obteniendo detalles del usuario ${userId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/personas/${userId}`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener detalles del usuario ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Obtener varios usuarios por IDs
   *
   * @param userIds Array de IDs de usuarios
   * @returns Array de usuarios
   */
  async getUsersDetails(userIds: string[]) {
    try {
      this.logger.debug(`Obteniendo detalles de ${userIds.length} usuarios`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.userServiceUrl}/personas/batch`, {
          ids: userIds,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(
        `Error obteniendo lote de usuarios: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Verificar si un usuario existe
   *
   * @param userId ID del usuario
   * @returns true si existe, false en caso contrario
   */
  async userExists(userId: string): Promise<boolean> {
    const user = await this.getUserDetails(userId);
    return !!user;
  }

  /**
   * Verificar si un usuario está activo
   *
   * @param userId ID del usuario
   * @returns true si el usuario está activo
   */
  async isUserActive(userId: string): Promise<boolean> {
    const user = await this.getUserDetails(userId);
    return user?.active === true;
  }

  /**
   * Obtener usuarios con rol específico
   *
   * @param role Rol a buscar
   * @returns Array de usuarios con el rol
   */
  async getUsersByRole(role: string) {
    try {
      this.logger.debug(`Obteniendo usuarios con rol ${role}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/personas/rol/${role}`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Error obteniendo usuarios por rol: ${error.message}`);
      return [];
    }
  }

  /**
   * Enriquecer asignación con detalles del usuario
   *
   * @param assignment Asignación base
   * @returns Asignación con información del usuario
   */
  async enrichAssignmentWithUser(assignment: any) {
    const user = await this.getUserDetails(assignment.userId);

    return {
      ...assignment,
      user: user
        ? {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            activo: user.activo || user.isActive,
            rol: user.rol || user.role,
          }
        : null,
    };
  }

  /**
   * Enriquecer múltiples asignaciones con detalles de usuarios
   *
   * @param assignments Array de asignaciones
   * @returns Asignaciones con información de usuarios
   */
  async enrichAssignmentsWithUsers(assignments: any[]) {
    const userIds = [...new Set(assignments.map((a) => a.userId))]; // IDs únicos
    const users = await this.getUsersDetails(userIds);

    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});

    return assignments.map((assignment) => ({
      ...assignment,
      user: userMap[assignment.userId] || null,
    }));
  }

  /**
   * Validar que todos los usuarios existen
   *
   * @param userIds Array de IDs de usuarios
   * @returns true si todos existen, false en caso contrario
   */
  async validateUsersExist(userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return true;

    const users = await this.getUsersDetails(userIds);
    return users.length === userIds.length;
  }

  /**
   * Health check del servicio de usuarios
   *
   * @returns true si está disponible
   */
  async checkUserServiceHealth(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/health`),
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Servicio de usuarios no disponible: ${error.message}`,
      );
      return false;
    }
  }
}
