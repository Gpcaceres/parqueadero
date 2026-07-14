import { Injectable, Logger } from '@nestjs/common';
import { AuditTrail } from '../entities/audit-trail.entity';
import { AuditTrailRepository } from '../repositories/audit-trail.repository';
import { AuditTrailFilterDto } from '../dtos/audit-trail.dto';

/**
 * Service: Audit / Trazabilidad
 * Gestiona el registro inmutable e independiente de cambios
 *
 * RF2: Implementa robustez desacoplando la auditoría
 * - Cada cambio se registra automáticamente
 * - Los registros de auditoría son inmutables
 * - Se incluye contexto completo (antes/después)
 * - Timestamps exactos con zona horaria
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private auditTrailRepository: AuditTrailRepository) {}

  /**
   * RF2: Registrar creación de asignación
   *
   * Almacena:
   * - IDs (userId, vehicleId) de la clave compuesta
   * - Nuevo estado
   * - Quién realizó la acción
   * - Timestamp exacto con zona horaria
   *
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @param performedByUserId Usuario que realizó la acción
   * @param newState Estado de la asignación creada
   * @param metadata Información adicional (IP, User Agent, etc.)
   */
  async logAssignmentCreated(
    userId: string,
    vehicleId: string,
    performedByUserId: string,
    newState: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<AuditTrail> {
    return this.createAuditLog({
      userId,
      vehicleId,
      actionType: 'CREACIÓN',
      performedByUserId,
      previousState: null,
      newState,
      description: `Vehículo ${vehicleId} asignado a usuario ${userId}`,
      metadata,
    });
  }

  /**
   * RF2: Registrar modificación de asignación
   *
   * Almacena cambios en atributos (notas, estado, etc.)
   *
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @param performedByUserId Usuario que realizó la acción
   * @param previousState Estado antes del cambio
   * @param newState Estado después del cambio
   * @param changeDescription Descripción del cambio
   * @param metadata Información adicional
   */
  async logAssignmentModified(
    userId: string,
    vehicleId: string,
    performedByUserId: string,
    previousState: Record<string, any>,
    newState: Record<string, any>,
    changeDescription: string,
    metadata?: Record<string, any>,
  ): Promise<AuditTrail> {
    return this.createAuditLog({
      userId,
      vehicleId,
      actionType: 'MODIFICACIÓN',
      performedByUserId,
      previousState,
      newState,
      description: changeDescription,
      metadata,
    });
  }

  /**
   * RF2: Registrar revocación de asignación
   *
   * Marca como ELIMINACIÓN cuando se revoca una asignación
   *
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @param performedByUserId Usuario que revocó
   * @param previousState Estado antes de revocar
   * @param newState Estado después de revocar
   * @param metadata Información adicional
   */
  async logAssignmentRevoked(
    userId: string,
    vehicleId: string,
    performedByUserId: string,
    previousState: Record<string, any>,
    newState: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<AuditTrail> {
    return this.createAuditLog({
      userId,
      vehicleId,
      actionType: 'ELIMINACIÓN',
      performedByUserId,
      previousState,
      newState,
      description: `Asignación revocada para usuario ${userId} y vehículo ${vehicleId}`,
      metadata,
    });
  }

  /**
   * Crear entrada de auditoría genérica
   *
   * Responsable de:
   * - Generar evento ID (UUID)
   * - Timestamp exacto en UTC
   * - Persistencia inmutable
   *
   * @param auditData Datos del evento
   * @returns Evento creado
   */
  private async createAuditLog(auditData: {
    userId: string;
    vehicleId: string;
    actionType: 'CREACIÓN' | 'MODIFICACIÓN' | 'ELIMINACIÓN';
    performedByUserId: string;
    previousState: Record<string, any> | null;
    newState: Record<string, any>;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<AuditTrail> {
    const auditTrail = this.auditTrailRepository.create({
      userId: auditData.userId,
      vehicleId: auditData.vehicleId,
      actionType: auditData.actionType,
      performedByUserId: auditData.performedByUserId,
      previousState: auditData.previousState,
      newState: auditData.newState,
      description: auditData.description,
      metadata: auditData.metadata || {},
    });

    const savedAudit = await this.auditTrailRepository.save(auditTrail);

    this.logger.log(
      `Evento de auditoría creado: ${auditData.actionType} - Usuario: ${auditData.userId}, Vehículo: ${auditData.vehicleId}`,
    );

    return savedAudit;
  }

  /**
   * RF2: Obtener historial completo de una asignación
   *
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @returns Array de eventos cronológicos
   */
  async getAssignmentHistory(
    userId: string,
    vehicleId: string,
  ): Promise<AuditTrail[]> {
    return this.auditTrailRepository.findHistoryByCompositeKey(
      userId,
      vehicleId,
    );
  }

  /**
   * Obtener auditoría de un usuario
   *
   * @param userId ID del usuario
   * @returns Array de eventos
   */
  async getUserAuditTrail(userId: string): Promise<AuditTrail[]> {
    return this.auditTrailRepository.findByUserId(userId);
  }

  /**
   * Obtener auditoría de un vehículo
   *
   * @param vehicleId ID del vehículo
   * @returns Array de eventos
   */
  async getVehicleAuditTrail(vehicleId: string): Promise<AuditTrail[]> {
    return this.auditTrailRepository.findByVehicleId(vehicleId);
  }

  /**
   * Consulta avanzada de auditoría con filtros
   *
   * @param filters Criterios de búsqueda
   * @returns Resultados paginados
   */
  async queryAuditTrail(filters: AuditTrailFilterDto) {
    return this.auditTrailRepository.findWithFilters(filters);
  }

  /**
   * Obtener últimos eventos de auditoría
   *
   * @param limit Número de eventos
   * @returns Array de eventos
   */
  async getLatestEvents(limit: number = 50): Promise<AuditTrail[]> {
    return this.auditTrailRepository.findLatestEvents(limit);
  }

  /**
   * Obtener resumen de actividad
   *
   * @param userId Filtrar por usuario (opcional)
   * @returns Resumen de acciones
   */
  async getActivitySummary(userId?: string) {
    return this.auditTrailRepository.getActionTypeSummary(userId);
  }

  /**
   * Obtener usuarios más activos en auditoría
   *
   * @param limit Número de usuarios a devolver
   * @returns Top usuarios
   */
  async getTopActiveUsers(limit: number = 10) {
    return this.auditTrailRepository.getTopActiveUsers(limit);
  }

  /**
   * Limpiar registros antiguos
   * Cumplimiento de políticas de retención
   *
   * @param beforeDate Fecha límite
   * @returns Número de registros eliminados
   */
  async purgeOldAuditRecords(beforeDate: Date): Promise<number> {
    const count = await this.auditTrailRepository.purgeOldRecords(beforeDate);
    this.logger.log(`${count} registros de auditoría eliminados`);
    return count;
  }
}
