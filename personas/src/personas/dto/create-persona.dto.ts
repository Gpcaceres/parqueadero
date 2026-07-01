import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { EsCedulaValida } from '../validators/cedula.validator';

const soloLetrasConMayuscula = /^[A-ZÁÉÍÓÚÑ][a-zA-ZáéíóúñÁÉÍÓÚÑ\s]*$/;
const mensajeNombre = (campo: string) =>
  `El ${campo} debe iniciar con mayúscula y contener solo letras`;

export class CreatePersonaDto {
  @IsString()
  @IsNotEmpty()
  @EsCedulaValida()
  dni: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(soloLetrasConMayuscula, { message: mensajeNombre('primer nombre') })
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(soloLetrasConMayuscula, { message: mensajeNombre('apellido') })
  last_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Matches(soloLetrasConMayuscula, { message: mensajeNombre('segundo nombre') })
  middle_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Matches(soloLetrasConMayuscula, { message: mensajeNombre('nacionalidad') })
  nationality?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{1,10}$/, { message: 'El teléfono debe contener solo dígitos y máximo 10' })
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
