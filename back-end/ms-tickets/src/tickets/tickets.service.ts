import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, EstadoTicket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ZoneIntegrationService } from './zone-integration.service';
import { EventPublisher, AuditEvent } from '../event-publisher.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    private readonly zoneIntegrationService: ZoneIntegrationService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  private async emitEvent(
    accion: string,
    ticket: Ticket,
    ip?: string,
    datosExtra?: Record<string, any>,
    usuario?: string,
    rol?: string,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-tickets',
      accion,
      entidad: 'TICKET',
      datos: { ...ticket, ...datosExtra },
      usuario,
      rol,
      ip,
    };
    await this.eventPublisher.publish(event);
  }

  async createTicket(
    createTicketDto: CreateTicketDto,
    ip?: string,
    usuario?: string,
    rol?: string,
  ): Promise<Ticket> {
    // Validar que el espacio esté disponible
    const existingTicket = await this.ticketsRepository.findOne({
      where: {
        id_espacio: createTicketDto.id_espacio,
        estado_ticket: EstadoTicket.ACTIVO,
      },
    });

    if (existingTicket) {
      throw new BadRequestException('El espacio ya está ocupado por otro ticket activo');
    }

    // El vehículo (por placa/cc) ya está dentro con un ticket activo: no puede
    // generar uno nuevo, solo se le puede registrar la salida/recaudación.
    const vehiculoDentro = await this.ticketsRepository.findOne({
      where: {
        id_vehiculo: createTicketDto.id_vehiculo,
        estado_ticket: EstadoTicket.ACTIVO,
      },
    });

    if (vehiculoDentro) {
      throw new BadRequestException(
        `El vehículo ${createTicketDto.id_vehiculo} ya se encuentra dentro (ticket ${vehiculoDentro.id_ticket} activo). Debe registrar su salida antes de generar un nuevo ticket.`,
      );
    }

    const ticket = this.ticketsRepository.create(createTicketDto);
    const ticketGuardado = await this.ticketsRepository.save(ticket);

    // El espacio pasa a OCUPADO mientras el ticket esté activo
    await this.zoneIntegrationService.marcarOcupado(ticketGuardado.id_espacio);
    await this.emitEvent('CREATE', ticketGuardado, ip, undefined, usuario, rol);

    return ticketGuardado;
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOneBy({ id_ticket: id });
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }
    return ticket;
  }

  async findByEspacio(id_espacio: string): Promise<Ticket | null> {
    return await this.ticketsRepository.findOne({
      where: { id_espacio, estado_ticket: EstadoTicket.ACTIVO },
    });
  }

  async findByUsuario(id_usuario: string): Promise<Ticket[]> {
    return await this.ticketsRepository.find({
      where: { id_usuario },
      order: { created_at: 'DESC' },
    });
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    ip?: string,
    usuario?: string,
    rol?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);

    const espacioAnterior = ticket.id_espacio;
    const cambiaEspacio =
      updateTicketDto.id_espacio !== undefined && updateTicketDto.id_espacio !== espacioAnterior;

    // Solo importa mover el espacio si el ticket está ACTIVO: uno inactivo
    // (pagado/anulado) ya no ocupa ningún espacio real en zonas.
    const debeResincronizar = cambiaEspacio && ticket.estado_ticket === EstadoTicket.ACTIVO;

    if (debeResincronizar) {
      const ocupado = await this.ticketsRepository.findOne({
        where: {
          id_espacio: updateTicketDto.id_espacio,
          estado_ticket: EstadoTicket.ACTIVO,
        },
      });
      if (ocupado) {
        throw new BadRequestException('El nuevo espacio ya está ocupado por otro ticket activo');
      }
    }

    const cambiaVehiculo =
      updateTicketDto.id_vehiculo !== undefined &&
      updateTicketDto.id_vehiculo !== ticket.id_vehiculo;

    if (cambiaVehiculo && ticket.estado_ticket === EstadoTicket.ACTIVO) {
      const vehiculoDentro = await this.ticketsRepository.findOne({
        where: {
          id_vehiculo: updateTicketDto.id_vehiculo,
          estado_ticket: EstadoTicket.ACTIVO,
        },
      });
      if (vehiculoDentro && vehiculoDentro.id_ticket !== ticket.id_ticket) {
        throw new BadRequestException(
          `El vehículo ${updateTicketDto.id_vehiculo} ya se encuentra dentro (ticket ${vehiculoDentro.id_ticket} activo). Debe registrar su salida antes de asignarlo a otro ticket.`,
        );
      }
    }

    Object.assign(ticket, updateTicketDto);
    const ticketGuardado = await this.ticketsRepository.save(ticket);

    if (debeResincronizar) {
      // Liberar el espacio viejo y ocupar el nuevo no dependen entre sí:
      // se disparan en paralelo en vez de uno tras otro.
      await Promise.all([
        this.zoneIntegrationService.marcarDisponible(espacioAnterior),
        this.zoneIntegrationService.marcarOcupado(ticketGuardado.id_espacio),
      ]);
    }

    await this.emitEvent('UPDATE', ticketGuardado, ip, undefined, usuario, rol);

    return ticketGuardado;
  }

  async registrarSalida(
    id: string,
    fecha_salida: Date,
    id_empleado?: string,
    ip?: string,
    usuario?: string,
    rol?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.estado_ticket !== EstadoTicket.ACTIVO) {
      throw new BadRequestException('El ticket no está activo');
    }

    ticket.fecha_hora_salida = fecha_salida;
    ticket.estado_ticket = EstadoTicket.PAGADO;
    if (id_empleado) {
      ticket.id_empleado = id_empleado;
    }

    const ticketGuardado = await this.ticketsRepository.save(ticket);

    // Ya se cobró/pagó: el espacio vuelve a estar DISPONIBLE
    await this.zoneIntegrationService.marcarDisponible(ticketGuardado.id_espacio);
    await this.emitEvent('UPDATE', ticketGuardado, ip, { accionTicket: 'SALIDA' }, usuario, rol);

    return ticketGuardado;
  }

  async anularTicket(
    id: string,
    motivo?: string,
    ip?: string,
    usuario?: string,
    rol?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const eraActivo = ticket.estado_ticket === EstadoTicket.ACTIVO;
    ticket.estado_ticket = EstadoTicket.ANULADO;
    const ticketGuardado = await this.ticketsRepository.save(ticket);

    // Si el ticket anulado tenía el espacio ocupado, se libera
    if (eraActivo) {
      await this.zoneIntegrationService.marcarDisponible(ticketGuardado.id_espacio);
    }

    await this.emitEvent(
      'UPDATE',
      ticketGuardado,
      ip,
      {
        accionTicket: 'ANULAR',
        motivo,
      },
      usuario,
      rol,
    );

    return ticketGuardado;
  }

  async remove(id: string, ip?: string, usuario?: string, rol?: string): Promise<void> {
    const ticket = await this.findOne(id);
    const eraActivo = ticket.estado_ticket === EstadoTicket.ACTIVO;
    await this.ticketsRepository.remove(ticket);

    // Si se elimina un ticket que seguía activo, el espacio se libera
    if (eraActivo) {
      await this.zoneIntegrationService.marcarDisponible(ticket.id_espacio);
    }

    await this.emitEvent('DELETE', ticket, ip, undefined, usuario, rol);
  }

  async obtenerEstadisticas(): Promise<any> {
    const activos = await this.ticketsRepository.count({
      where: { estado_ticket: EstadoTicket.ACTIVO },
    });

    const pagados = await this.ticketsRepository.count({
      where: { estado_ticket: EstadoTicket.PAGADO },
    });

    const anulados = await this.ticketsRepository.count({
      where: { estado_ticket: EstadoTicket.ANULADO },
    });

    const totalRecaudado = await this.ticketsRepository
      .createQueryBuilder()
      .select('SUM(valor_recaudado)', 'total')
      .where('estado_ticket = :estado', { estado: EstadoTicket.PAGADO })
      .getRawOne();

    return {
      activos,
      pagados,
      anulados,
      total: activos + pagados + anulados,
      totalRecaudado: totalRecaudado?.total || 0,
    };
  }
}
