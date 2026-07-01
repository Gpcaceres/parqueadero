import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FactoryPersonas } from './factory/factory-personas';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existe = await this.userRepository.findOneBy({ username: createUserDto.username });
    if (existe) {
      throw new BadRequestException(`El username ${createUserDto.username} ya está en uso`);
    }
    const passwordHash = Buffer.from(createUserDto.password).toString('base64');
    const user = FactoryPersonas.crearUsuario(createUserDto, passwordHash);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: { persona: true, userRoles: true } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id_person: id },
      relations: { persona: true, userRoles: true },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }

  async updateActive(id: string, active: boolean): Promise<User> {
    const user = await this.findOne(id);
    user.active = active;
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.username) {
      const existe = await this.userRepository.findOneBy({ username: updateUserDto.username });
      if (existe && existe.id_person !== id) {
        throw new BadRequestException(`El username ${updateUserDto.username} ya está en uso`);
      }
      user.username = updateUserDto.username;
    }
    if (updateUserDto.password) {
      user.password_hash = Buffer.from(updateUserDto.password).toString('base64');
    }
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete({ id_person: id });
  }
}
