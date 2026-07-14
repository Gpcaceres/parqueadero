import { IsString, IsUUID, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoTicket } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsUUID()
  id_espacio!: string;

  @IsUUID()
  id_usuario!: string;

  @IsString()
  id_vehiculo!: string; // CC o placa

  @IsString()
  tipo_vehiculo!: string;

  @IsDate()
  @Type(() => Date)
  fecha_hora_ingreso!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_hora_salida?: Date;

  @IsOptional()
  @IsEnum(EstadoTicket)
  estado_ticket?: EstadoTicket;

  @IsOptional()
  @IsUUID()
  id_empleado?: string;

  @IsOptional()
  valor_recaudado?: number;
}
