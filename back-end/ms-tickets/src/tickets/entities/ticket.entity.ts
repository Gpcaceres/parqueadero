import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoTicket {
  ACTIVO = 'activo',
  PAGADO = 'pagado',
  ANULADO = 'anulado',
}

// Plan de tarifa elegido al crear el ticket (ver tarifas.ts para los montos
// y la lógica de cobro de cada uno). Es fijo desde la creación: no se puede
// cambiar el plan a mitad de la estadía vía el PATCH genérico.
export enum TipoTarifa {
  MENSUAL = 'MENSUAL',
  POR_HORA = 'POR_HORA',
  NOCTURNO = 'NOCTURNO',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id_ticket!: string;

  @Column({ type: 'uuid' })
  id_espacio!: string;

  @Column({ type: 'uuid' })
  id_usuario!: string;

  @Column({ type: 'varchar', length: 20 })
  id_vehiculo!: string; // CC o placa del vehículo

  @Column({ type: 'varchar', length: 20 })
  tipo_vehiculo!: string; // auto, camioneta, motocicleta

  @Column({ type: 'timestamp' })
  fecha_hora_ingreso!: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_hora_salida!: Date;

  @Column({
    type: 'enum',
    enum: EstadoTicket,
    default: EstadoTicket.ACTIVO,
  })
  estado_ticket!: EstadoTicket;

  @Column({
    type: 'enum',
    enum: TipoTarifa,
    default: TipoTarifa.POR_HORA,
  })
  tipo_tarifa!: TipoTarifa;

  @Column({ type: 'uuid', nullable: true })
  id_empleado!: string; // empleado que registra la sesión

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_recaudado!: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at?: Date;
}
