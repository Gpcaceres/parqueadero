import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { FactoryPersonas } from './factory/factory-personas';
import { EventPublisher, AuditEvent } from '../event-publisher.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async create(createRoleDto: CreateRoleDto, ip?: string): Promise<Role> {
    const existe = await this.roleRepository.findOneBy({ name: createRoleDto.tipo });
    if (existe) {
      throw new BadRequestException(`El rol ${createRoleDto.tipo} ya existe`);
    }
    const role = FactoryPersonas.crearRol(createRoleDto);
    const saved = await this.roleRepository.save(role);
    await this.emitEvent('CREATE', saved, ip);
    return saved;
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id_role: id });
    if (!role) {
      throw new NotFoundException(`Rol con id ${id} no encontrado`);
    }
    return role;
  }

  async remove(id: string, ip?: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.delete(id);
    await this.emitEvent('DELETE', role, ip);
  }

  // Método auxiliar para publicar eventos de auditoría hacia ms-audit
  private async emitEvent(accion: string, role: Role, ip?: string) {
    const event: AuditEvent = {
      servicio: 'ms-personas',
      accion,
      entidad: 'ROL',
      datos: { id_role: role.id_role, name: role.name },
      ip,
    };
    await this.eventPublisher.publish(event);
  }
}
