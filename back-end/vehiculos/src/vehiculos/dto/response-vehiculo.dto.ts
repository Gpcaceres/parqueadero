import { Clasificacion } from '../entities/vehiculo.entity';
import { TipoMoto } from '../entities/motocicleta.entity';

export class ResponseVehiculoDto {
  id_vehiculo!: string;
  placa!: string;
  marca!: string;
  modelo!: string;
  color!: string;
  anio!: number;
  clasificacion!: Clasificacion;
  tipo!: string;
  numeroPuertas!: number;
  capacidadMaletero!: number;
  capacidadCarga!: number;
  cabina!: string;
  tipoMoto!: TipoMoto;
}
