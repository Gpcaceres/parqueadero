import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';

// fecha_hora_salida y estado_ticket quedan fuera del PATCH genérico: solo se
// modifican a través de sus endpoints dedicados (/salida y /anular), que
// además sincronizan el estado del espacio en zonas. Permitirlos aquí abriría
// la puerta a cerrar un ticket manualmente sin que el espacio se libere.
// tipo_tarifa se fija solo al crear el ticket (no se cambia el plan a mitad
// de la estadía). valor_recaudado no se acepta del cliente en ningún PATCH:
// se calcula solo en TicketsService.registrarSalida (ver tarifas.ts).
export class UpdateTicketDto extends PartialType(
  OmitType(CreateTicketDto, ['fecha_hora_salida', 'estado_ticket', 'tipo_tarifa'] as const),
) {}
