import { Column, ChildEntity } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';

@ChildEntity('Auto')
export class Auto extends Vehiculo {
  @Column()
  numeroPuertas!: number;

  @Column()
  capacidadMaletero!: number;

  @Column()
  capacidadCarga!: number;

  obtenerTipo(): string {
    return 'auto';
  }
}
