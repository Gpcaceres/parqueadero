import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../personas/entities/role.entity';
import { Permission } from '../personas/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

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
}
