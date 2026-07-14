import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoRol } from '../factory/factory-personas';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'El tipo de rol no puede estar vacío' })
  @IsEnum(TipoRol, {
    message: 'El tipo debe ser ADMINISTRADOR, CLIENTE, OPERADOR, ROOT o RECAUDADOR',
  })
  tipo: TipoRol;

  @IsString()
  @IsOptional()
  description?: string;
}
