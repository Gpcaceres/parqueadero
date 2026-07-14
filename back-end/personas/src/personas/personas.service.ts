import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { FactoryPersonas } from './factory/factory-personas';
import { EventPublisher, AuditEvent } from '../event-publisher.service';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async create(
    createPersonaDto: CreatePersonaDto,
    ip?: string,
    usuario?: string,
    rol?: string,
  ): Promise<Persona> {
    const porDni = await this.personaRepository.findOneBy({ dni: createPersonaDto.dni });
    if (porDni) {
      throw new BadRequestException(`Ya existe una persona con DNI ${createPersonaDto.dni}`);
    }
    const porEmail = await this.personaRepository.findOneBy({ email: createPersonaDto.email });
    if (porEmail) {
      throw new BadRequestException(`El correo ${createPersonaDto.email} ya está registrado`);
    }
    const persona = FactoryPersonas.crearPersona(createPersonaDto);
    const saved = await this.personaRepository.save(persona);
    await this.emitEvent('CREATE', saved, ip, usuario, rol);
    return saved;
  }

  async findAll(): Promise<Persona[]> {
    return this.personaRepository.find();
  }

  async findOne(id: string): Promise<Persona> {
    const persona = await this.personaRepository.findOneBy({ id_persona: id });
    if (!persona) {
      throw new NotFoundException(`Persona con id ${id} no encontrada`);
    }
    return persona;
  }

  async update(id: string, updatePersonaDto: UpdatePersonaDto, ip?: string): Promise<Persona> {
    await this.personaRepository.update(id, updatePersonaDto);
    const saved = await this.findOne(id);
    await this.emitEvent('UPDATE', saved, ip);
    return saved;
  }

  async remove(id: string, ip?: string): Promise<void> {
    const persona = await this.findOne(id);
    await this.personaRepository.delete(id);
    await this.emitEvent('DELETE', persona, ip);
  }

  // Método auxiliar para publicar eventos de auditoría hacia ms-audit
  private async emitEvent(
    accion: string,
    persona: Persona,
    ip?: string,
    usuario?: string,
    rol?: string,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-personas',
      accion,
      entidad: 'PERSONA',
      datos: {
        id_persona: persona.id_persona,
        dni: persona.dni,
        email: persona.email,
        active: persona.active,
      },
      usuario,
      rol,
      ip,
    };
    await this.eventPublisher.publish(event);
  }
}
