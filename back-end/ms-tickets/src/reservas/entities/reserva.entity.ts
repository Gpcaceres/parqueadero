import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// Sin enum de estados a propósito: no hay pantalla de "mis reservas" que
// necesite distinguir activa/expirada/cumplida todavía. "procesada" le
// basta al job de expiración para saber si ya la revisó (ver
// ReservasService.liberarExpiradas).
@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id_reserva!: string;

  @Column({ type: 'uuid' })
  id_espacio!: string;

  @Column({ type: 'uuid' })
  id_usuario!: string;

  @Column({ type: 'timestamp' })
  hora_reserva!: Date;

  @Column({ type: 'boolean', default: false })
  procesada!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at?: Date;
}
