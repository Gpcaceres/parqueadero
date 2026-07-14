import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { AuditTrail } from '../entities/audit-trail.entity';
import { AuditTrailFilterDto } from '../dtos/audit-trail.dto';

/**
 * Repository: Audit Trail
 * Maneja todas las operaciones de base de datos para registros de auditoría
 *
 * Responsabilidades:
 * - Guardar eventos de auditoría de forma inmutable
 * - Consultar historial de cambios
 * - Filtrar y buscar en registros de auditoría
 * - Proporcionar reportes de auditoría
 */
@Injectable()
export class AuditTrailRepository extends Repository<AuditTrail> {
  constructor(private dataSource: DataSource) {
    super(AuditTrail, dataSource.createEntityManager());
  }

  /**
   * Obtener el historial completo de una asignación
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @returns Array de eventos ordenados cronológicamente
   */
  async findHistoryByCompositeKey(
    userId: string,
    vehicleId: string,
  ): Promise<AuditTrail[]> {
    return this.find({
      where: { userId, vehicleId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtener todos los eventos de un usuario
   * @param userId ID del usuario
   * @returns Array de eventos
   */
  async findByUserId(userId: string): Promise<AuditTrail[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener todos los eventos de un vehículo
   * @param vehicleId ID del vehículo
   * @returns Array de eventos
   */
  async findByVehicleId(vehicleId: string): Promise<AuditTrail[]> {
    return this.find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener eventos de auditoría con filtros avanzados
   * @param filters Filtros de búsqueda
   * @returns Array de eventos paginados
   */
  async findWithFilters(filters: AuditTrailFilterDto) {
    let query = this.createQueryBuilder('a');

    // Filtrar por usuario
    if (filters.userId) {
      query = query.andWhere('a.userId = :userId', { userId: filters.userId });
    }

    // Filtrar por vehículo
    if (filters.vehicleId) {
      query = query.andWhere('a.vehicleId = :vehicleId', {
        vehicleId: filters.vehicleId,
      });
    }

    // Filtrar por tipo de acción
    if (filters.actionType) {
      query = query.andWhere('a.actionType = :actionType', {
        actionType: filters.actionType,
      });
    }

    // Filtrar por rango de fechas
    if (filters.fromDate && filters.toDate) {
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      query = query.andWhere('a.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    } else if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      query = query.andWhere('a.createdAt >= :fromDate', { fromDate });
    } else if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      query = query.andWhere('a.createdAt <= :toDate', { toDate });
    }

    // Ordenar por fecha descendente
    query = query.orderBy('a.createdAt', 'DESC');

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener los últimos N eventos
   * @param limit Número de eventos a devolver
   * @returns Array de eventos
   */
  async findLatestEvents(limit: number = 50): Promise<AuditTrail[]> {
    return this.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener resumen de acciones por tipo
   * @param userId Filtrar por usuario (opcional)
   * @returns Resumen de conteos por tipo de acción
   */
  async getActionTypeSummary(userId?: string) {
    let query = this.createQueryBuilder('a').select(
      'a.actionType',
      'actionType',
    );
    query = query.addSelect('COUNT(*)', 'count');

    if (userId) {
      query = query.where('a.userId = :userId', { userId });
    }

    return query
      .groupBy('a.actionType')
      .getRawMany() as Promise<Array<{ actionType: string; count: number }>>;
  }

  /**
   * Obtener usuarios más activos (realizaron más cambios)
   * @param limit Número de usuarios a devolver
   * @returns Top usuarios
   */
  async getTopActiveUsers(limit: number = 10) {
    return this.createQueryBuilder('a')
      .select('a.performedByUserId', 'userId')
      .addSelect('COUNT(*)', 'eventCount')
      .groupBy('a.performedByUserId')
      .orderBy('eventCount', 'DESC')
      .take(limit)
      .getRawMany();
  }

  /**
   * Eliminar registros de auditoría más antiguos que una fecha
   * Usado para mantenimiento y cumplimiento de políticas de retención
   * @param beforeDate Fecha límite
   * @returns Número de registros eliminados
   */
  async purgeOldRecords(beforeDate: Date): Promise<number> {
    const result = await this.delete({
      createdAt: Between(new Date('1970-01-01'), beforeDate),
    });
    return result.affected || 0;
  }
}
