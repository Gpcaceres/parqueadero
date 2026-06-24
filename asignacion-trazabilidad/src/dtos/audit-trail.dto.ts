/**
 * DTO: Respuesta de Registro de Auditoría
 * Información de un evento de cambio
 */
export class AuditTrailDto {
  /**
   * ID único del evento
   */
  eventId: string;

  /**
   * ID del usuario afectado
   */
  userId: string;

  /**
   * ID del vehículo afectado
   */
  vehicleId: string;

  /**
   * Tipo de acción
   */
  actionType: 'CREACIÓN' | 'MODIFICACIÓN' | 'ELIMINACIÓN';

  /**
   * Usuario que realizó la acción
   */
  performedByUserId: string;

  /**
   * Estado anterior
   */
  previousState?: Record<string, any>;

  /**
   * Estado nuevo
   */
  newState?: Record<string, any>;

  /**
   * Descripción legible
   */
  description: string;

  /**
   * Timestamp con zona horaria
   */
  createdAt: Date;

  /**
   * Metadata adicional
   */
  metadata?: Record<string, any>;
}

/**
 * DTO: Filtros para consulta de auditoría
 */
export class AuditTrailFilterDto {
  /**
   * Filtrar por usuario
   */
  userId?: string;

  /**
   * Filtrar por vehículo
   */
  vehicleId?: string;

  /**
   * Filtrar por tipo de acción
   */
  actionType?: 'CREACIÓN' | 'MODIFICACIÓN' | 'ELIMINACIÓN';

  /**
   * Fecha desde (ISO string)
   */
  fromDate?: string;

  /**
   * Fecha hasta (ISO string)
   */
  toDate?: string;

  /**
   * Número de página (paginación)
   */
  page?: number;

  /**
   * Registros por página
   */
  limit?: number;
}
