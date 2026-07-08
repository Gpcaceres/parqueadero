import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  id_person: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
