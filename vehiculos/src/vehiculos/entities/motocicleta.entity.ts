import { ChildEntity, Column } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';

export enum TipoMoto {
  DEPORTIVA = 'DEPORTIVA',
  SCOOTER = 'SCOOTER',
  MOTOCROSS = 'MOTOCROSS',
}

@ChildEntity('Motocicleta')
export class Motocicleta extends Vehiculo {
  @Column()
  tipo!: string;

  obtenerTipo(): string {
    return 'motocicleta';
  }
}
