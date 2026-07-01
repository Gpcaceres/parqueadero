import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async assignRole(dto: CreateUserRoleDto): Promise<UserRole> {
    const existe = await this.userRoleRepository.findOneBy({
      id_user: dto.id_user,
      id_role: dto.id_role,
    });
    if (existe) {
      throw new BadRequestException('El rol ya está asignado a este usuario');
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

  async removeRole(idUser: string, idRole: string): Promise<void> {
    const existe = await this.userRoleRepository.findOneBy({ id_user: idUser, id_role: idRole });
    if (!existe) {
      throw new NotFoundException('La asignación no existe');
    }
    await this.userRoleRepository.delete({ id_user: idUser, id_role: idRole });
  }
}
