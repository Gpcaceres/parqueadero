import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('eventos_auditoria')
export class EventoAuditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  servicio!: string; // ms-users, ms-auth, ms-products, etc.

  @Column({ type: 'varchar', length: 15 })
  action!: string; // CREATE - UPDATE - DELETE - LOGIN - LOGOUT - SELECT

  @Column({ type: 'varchar', length: 30 })
  entidad!: string;

  @Column({ type: 'jsonb', nullable: true })
  datos?: Record<string, any>;

  @Column({ type: 'varchar', length: 25, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  rol?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string;

  @Column({ type: 'varchar', length: 17, nullable: true })
  mac?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date;
}
