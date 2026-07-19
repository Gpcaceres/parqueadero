import { IsString, IsUUID, IsDate, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoTicket, TipoTarifa } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsUUID()
  id_espacio!: string;

  @IsUUID()
  id_usuario!: string;

  @IsString()
  id_vehiculo!: string; // CC o placa

  @IsString()
  tipo_vehiculo!: string;

  // fecha_hora_ingreso NO se acepta del cliente: TicketsService.createTicket
  // la captura sola con la hora del servidor en el instante real de creación,
  // igual que fecha_hora_salida en registrarSalida. Permitir un valor manual
  // aquí dejaría manipular las horas/fracción realmente cobradas en
  // tarifas.ts (POR_HORA y el excedente de NOCTURNO dependen del tiempo
  // transcurrido desde el ingreso).

  // Plan de tarifa elegido al crear el ticket (mensual/por hora/nocturno,
  // ver tarifas.ts). Es obligatorio: define cómo se calculará
  // valor_recaudado al registrar la salida.
  @IsNotEmpty()
  @IsEnum(TipoTarifa)
  tipo_tarifa!: TipoTarifa;

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

  // valor_recaudado NO se acepta del cliente: se calcula solo en
  // TicketsService.registrarSalida a partir de tipo_tarifa y el tiempo real
  // transcurrido (ver tarifas.ts), igual que fecha_hora_salida.
}
