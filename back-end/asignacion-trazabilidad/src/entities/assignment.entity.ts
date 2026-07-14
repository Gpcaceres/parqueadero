import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entity: Vehicle Assignment
 * Representa la asignación de un vehículo a un propietario
 *
 * Clave Compuesta: (user_id, vehicle_id)
 * Un vehículo solo puede estar activo en un propietario a la vez
 */
@Entity('assignments')
@Index(['userId', 'vehicleId'], { unique: true })
@Index(['userId'])
@Index(['vehicleId'])
@Index(['isActive'])
export class Assignment {
  /**
   * ID del propietario/usuario
   * Parte de la clave compuesta
   */
  @PrimaryColumn('uuid')
  userId: string;

  /**
   * ID del vehículo
   * Parte de la clave compuesta
   */
  @PrimaryColumn('uuid')
  vehicleId: string;

  /**
   * Estado de la asignación
   * true: asignación activa
   * false: asignación revocada/eliminada
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Información de auditoría: quién realizó la asignación
   * Useful para tracking de cambios
   */
  @Column({ type: 'uuid', nullable: true })
  assignedByUserId: string;

  /**
   * Notas o comentarios sobre la asignación
   * Ej: "Vehículo principal", "Uso ocasional", etc.
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /**
   * Timestamp de creación
   * Generado automáticamente
   */
  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  /**
   * Timestamp de última actualización
   * Generado automáticamente
   */
  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
