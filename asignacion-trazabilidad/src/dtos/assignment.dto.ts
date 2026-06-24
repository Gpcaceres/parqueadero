/**
 * DTO: Respuesta de Asignación
 * Información completa de una asignación de vehículo
 */
export class AssignmentDto {
  /**
   * ID del propietario
   */
  userId: string;

  /**
   * ID del vehículo
   */
  vehicleId: string;

  /**
   * Estado de la asignación
   */
  isActive: boolean;

  /**
   * ID del usuario que realizó la asignación
   */
  assignedByUserId?: string;

  /**
   * Notas sobre la asignación
   */
  notes?: string;

  /**
   * Timestamp de creación
   */
  createdAt: Date;

  /**
   * Timestamp de última actualización
   */
  updatedAt: Date;
}

/**
 * DTO: Asignación con detalles del vehículo
 * Extiende AssignmentDto con información del vehículo
 */
export class AssignmentWithVehicleDto extends AssignmentDto {
  /**
   * Detalles del vehículo asignado
   */
  vehicle: {
    id: string;
    type: string; // Moto, Automóvil, Camioneta
    category: string; // Eléctrico, Híbrido, Combustión
    brand?: string;
    model?: string;
    licensePlate?: string;
    year?: number;
  };
}
