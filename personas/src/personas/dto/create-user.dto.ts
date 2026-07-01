import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  id_person: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
