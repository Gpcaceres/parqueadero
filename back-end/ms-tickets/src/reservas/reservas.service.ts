import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { ZoneIntegrationService } from '../tickets/zone-integration.service';

const MS_POR_MINUTO = 60 * 1000;
const ANTICIPACION_MINIMA_MIN = 60;
const MINUTOS_GRACIA = 10;

function esMismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    private readonly zoneIntegrationService: ZoneIntegrationService,
  ) {}

  async crearReserva(dto: CreateReservaDto, idUsuario: string): Promise<Reserva> {
    const ahora = new Date();
    const horaReserva = new Date(dto.hora_reserva);

    // Reglas de horario pedidas: la reserva es siempre para el mismo día, y
    // con al menos 1 hora de anticipación respecto al momento de crearla.
    if (!esMismoDia(horaReserva, ahora)) {
      throw new BadRequestException('La reserva debe ser para el mismo día de hoy');
    }
    const minutosDeAnticipacion = (horaReserva.getTime() - ahora.getTime()) / MS_POR_MINUTO;
    if (minutosDeAnticipacion < ANTICIPACION_MINIMA_MIN) {
      throw new BadRequestException(
        `La reserva debe hacerse con al menos ${ANTICIPACION_MINIMA_MIN} minutos de anticipación`,
      );
    }

    const estadoActual = await this.zoneIntegrationService.obtenerEstado(dto.id_espacio);
    if (estadoActual !== 'DISPONIBLE') {
      throw new BadRequestException(
        `El espacio no está disponible para reservar (estado actual: ${estadoActual ?? 'desconocido'})`,
      );
    }

    const yaReservado = await this.reservasRepository.findOne({
      where: { id_espacio: dto.id_espacio, procesada: false },
    });
    if (yaReservado) {
      throw new BadRequestException('El espacio ya tiene una reserva activa');
    }

    const reserva = this.reservasRepository.create({
      id_espacio: dto.id_espacio,
      id_usuario: idUsuario,
      hora_reserva: horaReserva,
    });
    const reservaGuardada = await this.reservasRepository.save(reserva);

    await this.zoneIntegrationService.marcarReservado(dto.id_espacio);

    return reservaGuardada;
  }

  async findAll(): Promise<Reserva[]> {
    return await this.reservasRepository.find({ order: { created_at: 'DESC' } });
  }

  async findByUsuario(idUsuario: string): Promise<Reserva[]> {
    return await this.reservasRepository.find({
      where: { id_usuario: idUsuario },
      order: { created_at: 'DESC' },
    });
  }

  // La reserva activa (sin procesar) de un espacio, si tiene una -- usada
  // para mostrarle al personal, en la tarjeta RESERVADO del dashboard, el
  // contacto de quien reservó (ver ReservasController.findByEspacio).
  async findByEspacio(idEspacio: string): Promise<Reserva | null> {
    return await this.reservasRepository.findOne({
      where: { id_espacio: idEspacio, procesada: false },
      order: { created_at: 'DESC' },
    });
  }

  // Cancelación manual por personal (admin/recaudador/root, ver
  // ReservasController): a diferencia de liberarExpiradas, esta puede
  // dispararse en cualquier momento, no solo cuando venció el plazo de
  // gracia -- ej. el cliente avisó que ya no llega.
  async cancelarReserva(idReserva: string): Promise<Reserva> {
    const reserva = await this.reservasRepository.findOne({ where: { id_reserva: idReserva } });
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }
    if (reserva.procesada) {
      throw new BadRequestException('La reserva ya fue procesada');
    }

    await this.zoneIntegrationService.liberarSiReservado(reserva.id_espacio);
    reserva.procesada = true;
    return await this.reservasRepository.save(reserva);
  }

  // Corre cada 60s: libera los espacios cuya reserva venció hace más de
  // MINUTOS_GRACIA sin que el cliente se presentara. Si el personal ya
  // generó el ticket real antes de la expiración, liberarSiReservado no
  // hace nada (el espacio ya está OCUPADO, no RESERVADO).
  @Interval(60_000)
  async liberarExpiradas(): Promise<void> {
    const limite = new Date(Date.now() - MINUTOS_GRACIA * MS_POR_MINUTO);
    const vencidas = await this.reservasRepository.find({
      where: { procesada: false, hora_reserva: LessThan(limite) },
    });

    for (const reserva of vencidas) {
      await this.zoneIntegrationService.liberarSiReservado(reserva.id_espacio);
      reserva.procesada = true;
      await this.reservasRepository.save(reserva);
      this.logger.log(`Reserva ${reserva.id_reserva} expirada, espacio liberado si seguía reservado`);
    }
  }
}
