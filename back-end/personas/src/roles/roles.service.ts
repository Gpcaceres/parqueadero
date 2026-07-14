import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../personas/entities/role.entity';
import { Permission } from '../personas/entities/permission.entity';
import { CreateRoleDto } from '../personas/dto/create-role.dto';
import { FactoryPersonas } from '../personas/factory/factory-personas';
import { EventPublisher, AuditEvent } from '../event-publisher.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async create(
    createRoleDto: CreateRoleDto,
    ip?: string,
    usuario?: string,
    rol?: string,
  ): Promise<Role> {
    const existe = await this.rolesRepository.findOneBy({ name: createRoleDto.tipo });
    if (existe) {
      throw new BadRequestException(`El rol ${createRoleDto.tipo} ya existe`);
    }
    const role = FactoryPersonas.crearRol(createRoleDto);
    const saved = await this.rolesRepository.save(role);
    await this.emitEvent('CREATE', saved, ip, usuario, rol);
    return saved;
  }

  async findAll() {
    return await this.rolesRepository.find({
      relations: { permissions: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findOne({
      where: { id_role: id },
      relations: { permissions: true, userRoles: true },
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return role;
  }

  async findByName(name: string) {
    return await this.rolesRepository.findOne({
      where: { name },
      relations: { permissions: true },
    });
  }

  async remove(id: string, ip?: string, usuario?: string, rol?: string): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepository.delete(id);
    await this.emitEvent('DELETE', role, ip, usuario, rol);
  }

  async getAllPermissions() {
    return await this.permissionsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getPermissionsByRole(roleId: string) {
    const role = await this.findOne(roleId);
    return role.permissions;
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.findOne(roleId);
    const permissions = await this.permissionsRepository.find({
      where: permissionIds.map((id) => ({ id_permission: id })),
    });

    role.permissions = permissions;
    return await this.rolesRepository.save(role);
  }

  // Método auxiliar para publicar eventos de auditoría hacia ms-audit
  private async emitEvent(
    accion: string,
    role: Role,
    ip?: string,
    usuario?: string,
    rol?: string,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-personas',
      accion,
      entidad: 'ROL',
      datos: { id_role: role.id_role, name: role.name },
      usuario,
      rol,
      ip,
    };
    await this.eventPublisher.publish(event);
  }
}
