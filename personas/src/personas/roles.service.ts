import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { FactoryPersonas } from './factory/factory-personas';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existe = await this.roleRepository.findOneBy({ name: createRoleDto.tipo });
    if (existe) {
      throw new BadRequestException(`El rol ${createRoleDto.tipo} ya existe`);
    }
    const role = FactoryPersonas.crearRol(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Rol con id ${id} no encontrado`);
    }
    return role;
  }

  async remove(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }
}
