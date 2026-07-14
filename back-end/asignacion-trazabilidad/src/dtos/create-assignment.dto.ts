import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO: Crear Asignación de Vehículo
 * Request para asignar un vehículo a un propietario
 */
export class CreateAssignmentDto {
  /**
   * ID del propietario/usuario
   * Formato: UUID válido
   */
  @IsUUID()
  userId: string;

  /**
   * ID del vehículo
   * Formato: UUID válido
   */
  @IsUUID()
  vehicleId: string;

  /**
   * Notas opcionales sobre la asignación
   * Ej: "Vehículo principal", "Uso ocasional"
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
