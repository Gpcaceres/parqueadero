import {
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Max,
  Min,
  IsIn,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class BaseVehiculo {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}-\d{4}$/, {
    message: 'La placa debe tener el formato ABC-1234',
  })
  placa!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'La marca debe tener al menos 2 caracteres',
  })
  @MaxLength(30, {
    message: 'La marca no puede tener más de 30 caracteres',
  })
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'La marca solo puede contener letras y espacios',
  })
  marca!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'La marca debe tener al menos 2 caracteres',
  })
  @MaxLength(30, {
    message: 'La marca no puede tener más de 30 caracteres',
  })
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'La marca solo puede contener letras y espacios',
  })
  modelo!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'La marca debe tener al menos 2 caracteres',
  })
  @MaxLength(30, {
    message: 'La marca no puede tener más de 30 caracteres',
  })
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'La marca solo puede contener letras y espacios',
  })
  color!: string;

  @Min(1885, {
    message: 'El año debe ser mayor o igual a 1885',
  })
  @Max(new Date().getFullYear() + 1, {
    message: 'El año no puede ser mayor al año actual más uno',
  })
  anio!: number;

  @IsOptional()
  @IsIn(['ELECTRICO', 'GASOLINA', 'HIBRIDO', 'DIESEL'], {
    message: 'La clasificación debe ser ELECTRICO, GASOLINA, HIBRIDO o DIESEL',
  })
  clasificacion?: string;
}

class AutoDto extends BaseVehiculo {
  @Min(2, {
    message: 'El número de puertas debe ser al menos 2',
  })
  @Max(5, {
    message: 'El número de puertas no puede ser mayor a 5',
  })
  numeroPuertas!: number;

  @Min(100, {
    message: 'La capacidad del maletero debe ser al menos 100 litros',
  })
  @Max(1000, {
    message: 'La capacidad del maletero no puede ser mayor a 1000 litros',
  })
  capacidadMaletero!: number;

  @Min(0, {
    message: 'La capacidad de carga debe ser al menos 0 kg',
  })
  @Max(10000, {
    message: 'La capacidad de carga no puede ser mayor a 10000 kg',
  })
  capacidadCarga!: number;
}

class MotocicletaDto extends BaseVehiculo {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(Deportiva|Scooter|Motocross)$/, {
    message: 'El tipo de motocicleta debe ser Deportiva, Scooter o Motocross',
  })
  tipo!: string;
}

class CamionetaDto extends BaseVehiculo {
  @Min(0, {
    message: 'La capacidad de carga debe ser al menos 0 kg',
  })
  @Max(10000, {
    message: 'La capacidad de carga no puede ser mayor a 10000 kg',
  })
  capacidadCarga!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(Simple|Doble)$/, {
    message: 'El tipo de cabina debe ser Simple o Doble',
  })
  cabina!: string;
}

export class CreateVehiculoDto {
  @IsIn(['Auto', 'Moto', 'Camioneta'])
  tipo!: string;

  @ValidateNested()
  @Type((opts) => {
    const object = opts?.object as CreateVehiculoDto;
    if (!object) return BaseVehiculo;

    switch (object.tipo) {
      case 'Auto':
        return AutoDto;
      case 'Moto':
        return MotocicletaDto;
      case 'Camioneta':
        return CamionetaDto;
      default:
        return BaseVehiculo;
    }
  })
  datos!: AutoDto | MotocicletaDto | CamionetaDto;
}
