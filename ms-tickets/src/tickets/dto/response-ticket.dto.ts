import { Expose } from 'class-transformer';
import { EstadoTicket } from '../entities/ticket.entity';

export class ResponseTicketDto {
  @Expose()
  id_ticket!: string;

  @Expose()
  id_espacio!: string;

  @Expose()
  id_usuario!: string;

  @Expose()
  id_vehiculo!: string;

  @Expose()
  tipo_vehiculo!: string;

  @Expose()
  fecha_hora_ingreso!: Date;

  @Expose()
  fecha_hora_salida!: Date | null;

  @Expose()
  estado_ticket!: EstadoTicket;

  @Expose()
  id_empleado!: string | null;

  @Expose()
  valor_recaudado!: number | null;

  @Expose()
  created_at!: Date;

  @Expose()
  updated_at!: Date;
}
