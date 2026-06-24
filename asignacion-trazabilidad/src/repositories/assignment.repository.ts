import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Assignment } from '../entities/assignment.entity';

/**
 * Repository: Assignment
 * Maneja todas las operaciones de base de datos para asignaciones
 *
 * Responsabilidades:
 * - CRUD de asignaciones
 * - Consultas por usuario
 * - Consultas por vehículo
 * - Validación de integridad de claves compuestas
 */
@Injectable()
export class AssignmentRepository extends Repository<Assignment> {
  constructor(private dataSource: DataSource) {
    super(Assignment, dataSource.createEntityManager());
  }

  /**
   * Encontrar asignación por clave compuesta (userId, vehicleId)
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @returns Asignación si existe, null en caso contrario
   */
  async findByCompositeKey(
    userId: string,
    vehicleId: string,
  ): Promise<Assignment | null> {
    return this.findOne({
      where: { userId, vehicleId },
    });
  }

  /**
   * Obtener todos los vehículos asignados a un usuario
   * @param userId ID del usuario
   * @param activeOnly Si true, solo devuelve asignaciones activas
   * @returns Array de asignaciones
   */
  async findByUserId(
    userId: string,
    activeOnly: boolean = true,
  ): Promise<Assignment[]> {
    const query = this.createQueryBuilder('a').where('a.userId = :userId', {
      userId,
    });

    if (activeOnly) {
      query.andWhere('a.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('a.createdAt', 'DESC').getMany();
  }

  /**
   * Obtener todos los usuarios que tienen un vehículo asignado
   * @param vehicleId ID del vehículo
   * @param activeOnly Si true, solo devuelve asignaciones activas
   * @returns Array de asignaciones
   */
  async findByVehicleId(
    vehicleId: string,
    activeOnly: boolean = true,
  ): Promise<Assignment[]> {
    const query = this.createQueryBuilder('a').where(
      'a.vehicleId = :vehicleId',
      { vehicleId },
    );

    if (activeOnly) {
      query.andWhere('a.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('a.createdAt', 'DESC').getMany();
  }

  /**
   * Verificar si un vehículo está activamente asignado
   * @param vehicleId ID del vehículo
   * @returns true si está asignado a algún usuario activo
   */
  async isVehicleActivelyAssigned(vehicleId: string): Promise<boolean> {
    const assignment = await this.findOne({
      where: { vehicleId, isActive: true },
    });
    return !!assignment;
  }

  /**
   * Obtener el propietario actual de un vehículo
   * @param vehicleId ID del vehículo
   * @returns Usuario propietario o null
   */
  async getCurrentOwnerOfVehicle(vehicleId: string): Promise<string | null> {
    const assignment = await this.findOne({
      where: { vehicleId, isActive: true },
    });
    return assignment?.userId || null;
  }

  /**
   * Desactivar todas las asignaciones de un vehículo
   * Usado cuando se revoca el acceso a un vehículo
   * @param vehicleId ID del vehículo
   */
  async deactivateVehicleAssignments(vehicleId: string): Promise<void> {
    await this.update(
      { vehicleId },
      { isActive: false },
    );
  }

  /**
   * Desactivar todas las asignaciones de un usuario
   * Usado cuando se desactiva una cuenta
   * @param userId ID del usuario
   */
  async deactivateUserAssignments(userId: string): Promise<void> {
    await this.update(
      { userId },
      { isActive: false },
    );
  }

  /**
   * Contar vehículos asignados a un usuario
   * @param userId ID del usuario
   * @param activeOnly Si true, solo cuenta activos
   * @returns Número de asignaciones
   */
  async countUserAssignments(
    userId: string,
    activeOnly: boolean = true,
  ): Promise<number> {
    const query = this.createQueryBuilder('a').where('a.userId = :userId', {
      userId,
    });

    if (activeOnly) {
      query.andWhere('a.isActive = :isActive', { isActive: true });
    }

    return query.getCount();
  }
}
