import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

export enum Clasificacion {
  ELECTRICO = 'ELECTRICO',
  GASOLINA = 'GASOLINA',
  HIBRIDO = 'HIBRIDO',
  DIESEL = 'DIESEL',
}

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } })
export abstract class Vehiculo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  placa!: string;

  @Column()
  marca!: string;

  @Column()
  modelo!: string;

  @Column()
  color!: string;

  @Column({ type: 'enum', enum: Clasificacion })
  clasificacion!: Clasificacion;

  @Column()
  anio!: number;
}
