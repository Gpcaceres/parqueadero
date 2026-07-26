import { IsUUID, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservaDto {
  @IsUUID()
  id_espacio!: string;

  // id_usuario NO se acepta aquí: se toma de req.user.id_user (el JWT),
  // igual que fecha_hora_ingreso en tickets -- nadie puede reservar a
  // nombre de otro con solo cambiar el body.
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  hora_reserva!: Date;
}
