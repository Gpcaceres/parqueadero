import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(EventoAuditoria)
    private readonly auditRepo: Repository<EventoAuditoria>,
  ) {}

  async create(dto: CreateAuditEventDto): Promise<EventoAuditoria> {
    const nuevoEvento = this.auditRepo.create({
      servicio: dto.servicio,
      action: dto.accion,
      entidad: dto.entidad,
      datos: dto.datos,
      username: dto.usuario,
      ip: dto.ip,
      mac: dto.mac,
    });

    return this.auditRepo.save(nuevoEvento);
  }

  async findAll(): Promise<EventoAuditoria[]> {
    return this.auditRepo.find({ order: { timestamp: 'DESC' } });
  }

  async findOne(id: string): Promise<EventoAuditoria | null> {
    return this.auditRepo.findOne({ where: { id } });
  }
}
