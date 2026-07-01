import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'El username no puede estar vacío' })
  @MaxLength(15)
  username?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'El password no puede estar vacío' })
  password?: string;
}
