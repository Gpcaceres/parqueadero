import { ChildEntity, Column } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';

@ChildEntity('Camioneta')
export class Camioneta extends Vehiculo {
  @Column()
  cabina!: string;

  @Column()
  capacidadCarga!: number;

  obtenerTipo(): string {
    return 'camioneta';
  }
}
