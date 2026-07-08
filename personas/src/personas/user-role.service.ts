import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { Role } from './entities/role.entity';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

const RESTRICTED_ROLE_NAMES = ['admin', 'root'];

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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

  async assignRole(dto: CreateUserRoleDto, requesterRoles: string[]): Promise<UserRole> {
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
      return this.userRoleRepository.save(existe);
    }
    const userRole = new UserRole();
    userRole.id_user = dto.id_user;
    userRole.id_role = dto.id_role;
    userRole.active = true;
    return this.userRoleRepository.save(userRole);
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
    return this.userRoleRepository.save(userRole);
  }

  async removeRole(idUser: string, idRole: string, requesterRoles: string[]): Promise<void> {
    await this.assertCanManageRole(idRole, requesterRoles);

    const existe = await this.userRoleRepository.findOneBy({ id_user: idUser, id_role: idRole });
    if (!existe) {
      throw new NotFoundException('La asignación no existe');
    }
    await this.userRoleRepository.delete({ id_user: idUser, id_role: idRole });
  }
}
