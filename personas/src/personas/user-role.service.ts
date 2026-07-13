import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { Role } from './entities/role.entity';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { EventPublisher, AuditEvent } from '../event-publisher.service';

const RESTRICTED_ROLE_NAMES = ['admin', 'root'];

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly eventPublisher: EventPublisher,
  ) {}

  private async assertCanManageRole(idRole: string, requesterRoles: string[]): Promise<void> {
    if (requesterRoles.includes('root')) {
      return;
    }
    if (!requesterRoles.includes('admin')) {
      throw new ForbiddenException('Se requiere rol admin o root para gestionar roles de usuario');
    }
    const role = await this.roleRepository.findOneBy({ id_role: idRole });
    if (role && RESTRICTED_ROLE_NAMES.includes(role.name)) {
      throw new ForbiddenException(
        `Solo un usuario con rol root puede asignar o modificar el rol "${role.name}"`,
      );
    }
  }

  async assignRole(
    dto: CreateUserRoleDto,
    requesterRoles: string[],
    requesterUsername?: string,
    ip?: string,
  ): Promise<UserRole> {
    await this.assertCanManageRole(dto.id_role, requesterRoles);

    const existe = await this.userRoleRepository.findOneBy({
      id_user: dto.id_user,
      id_role: dto.id_role,
    });
    if (existe) {
      if (existe.active) {
        throw new BadRequestException('El rol ya está asignado y activo para este usuario');
      }
      existe.active = true;
      const saved = await this.userRoleRepository.save(existe);
      await this.emitEvent('CREATE', saved, requesterUsername, ip);
      return saved;
    }
    const userRole = new UserRole();
    userRole.id_user = dto.id_user;
    userRole.id_role = dto.id_role;
    userRole.active = true;
    const saved = await this.userRoleRepository.save(userRole);
    await this.emitEvent('CREATE', saved, requesterUsername, ip);
    return saved;
  }

  async findByUser(idUser: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({
      where: { id_user: idUser },
      relations: { role: true },
    });
  }

  async setActive(
    idUser: string,
    idRole: string,
    active: boolean,
    requesterRoles: string[],
    requesterUsername?: string,
    ip?: string,
  ): Promise<UserRole> {
    await this.assertCanManageRole(idRole, requesterRoles);

    const userRole = await this.userRoleRepository.findOneBy({
      id_user: idUser,
      id_role: idRole,
    });
    if (!userRole) {
      throw new NotFoundException('La asignación no existe');
    }
    userRole.active = active;
    const saved = await this.userRoleRepository.save(userRole);
    await this.emitEvent('UPDATE', saved, requesterUsername, ip);
    return saved;
  }

  async removeRole(
    idUser: string,
    idRole: string,
    requesterRoles: string[],
    requesterUsername?: string,
    ip?: string,
  ): Promise<void> {
    await this.assertCanManageRole(idRole, requesterRoles);

    const existe = await this.userRoleRepository.findOneBy({ id_user: idUser, id_role: idRole });
    if (!existe) {
      throw new NotFoundException('La asignación no existe');
    }
    await this.userRoleRepository.delete({ id_user: idUser, id_role: idRole });
    await this.emitEvent('DELETE', existe, requesterUsername, ip);
  }

  // Método auxiliar para publicar eventos de auditoría hacia ms-audit
  private async emitEvent(
    accion: string,
    userRole: UserRole,
    usuario?: string,
    ip?: string,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-personas',
      accion,
      entidad: 'USER-ROLE',
      datos: {
        id_user: userRole.id_user,
        id_role: userRole.id_role,
        active: userRole.active,
      },
      usuario,
      ip,
    };
    await this.eventPublisher.publish(event);
  }
}
