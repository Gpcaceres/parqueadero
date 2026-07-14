import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * Entity: Audit Trail / Trazabilidad
 * Registro inmutable de todos los cambios en las asignaciones
 *
 * Propósito: Mantener un historial completo y auditable de:
 * - Creación de asignaciones
 * - Modificación de asignaciones
 * - Eliminación de asignaciones
 *
 * Desacoplado: Guardado en tabla separada para robustez
 */
@Entity('audit_trails')
@Index(['eventId'])
@Index(['userId', 'vehicleId'])
@Index(['actionType'])
@Index(['createdAt'])
@Index(['userId'])
export class AuditTrail {
  /**
   * ID único del evento de auditoría
   * Generado automáticamente (UUID)
   */
  @PrimaryGeneratedColumn('uuid')
  eventId: string;

  /**
   * ID del propietario/usuario afectado
   * Parte de la clave compuesta original
   */
  @Column('uuid')
  userId: string;

  /**
   * ID del vehículo afectado
   * Parte de la clave compuesta original
   */
  @Column('uuid')
  vehicleId: string;

  /**
   * Tipo de acción realizada
   * Valores: CREACIÓN, MODIFICACIÓN, ELIMINACIÓN
   */
  @Column({
    type: 'enum',
    enum: ['CREACIÓN', 'MODIFICACIÓN', 'ELIMINACIÓN'],
  })
  actionType: 'CREACIÓN' | 'MODIFICACIÓN' | 'ELIMINACIÓN';

  /**
   * ID del usuario que realizó la acción
   * Útil para auditoría de quién hizo qué
   */
  @Column('uuid')
  performedByUserId: string;

  /**
   * Estado anterior (para MODIFICACIÓN y ELIMINACIÓN)
   * Almacena el snapshot del estado antes del cambio
   */
  @Column({ type: 'jsonb', nullable: true })
  previousState: Record<string, any>;

  /**
   * Estado nuevo (para CREACIÓN y MODIFICACIÓN)
   * Almacena el snapshot del estado después del cambio
   */
  @Column({ type: 'jsonb', nullable: true })
  newState: Record<string, any>;

  /**
   * Descripción legible del cambio
   * Ej: "Vehículo asignado a propietario", "Asignación revocada", etc.
   */
  @Column('text')
  description: string;

  /**
   * Timestamp exacto con zona horaria
   * Generado automáticamente en UTC
   * Formato: 2024-06-24 14:30:45.123+00
   */
  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  /**
   * Información adicional/contexto
   * Ej: IP del cliente, User Agent, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
