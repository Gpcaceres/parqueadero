import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateUserRoleDto {
  @IsNotEmpty({ message: 'El id_user no puede estar vacío' })
  @IsUUID('4', { message: 'El id_user debe ser un UUID válido' })
  id_user: string;

  @IsNotEmpty({ message: 'El id_role no puede estar vacío' })
  @IsUUID('4', { message: 'El id_role debe ser un UUID válido' })
  id_role: string;
}
