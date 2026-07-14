import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'galopez11',
    description: 'Nombre de usuario único',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Guillermo', description: 'Nombre' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'López', description: 'Apellido' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'guillermo@example.com',
    description: 'Correo electrónico',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '3101234567',
    description: 'Teléfono',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
