import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Persona } from './entities/persona.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FactoryPersonas } from './factory/factory-personas';

const SALT_ROUNDS = 10;
const USERNAME_MAX_LENGTH = 15;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const persona = await this.personaRepository.findOneBy({ id_persona: createUserDto.id_user });
    if (!persona) {
      throw new BadRequestException(`No existe una persona con id ${createUserDto.id_user}`);
    }

    const username = await this.generateUniqueUsername(persona);
    const passwordHash = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);

    persona.email = `${username}@test.com`;
    await this.personaRepository.save(persona);

    const user = FactoryPersonas.crearUsuario(createUserDto.id_user, username, passwordHash);
    return this.userRepository.save(user);
  }

  private normalizeUsernamePart(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private async generateUniqueUsername(persona: Persona): Promise<string> {
    const firstInitial = this.normalizeUsernamePart(persona.first_name.charAt(0));
    const middleInitial = persona.middle_name
      ? this.normalizeUsernamePart(persona.middle_name.charAt(0))
      : '';
    const lastName = this.normalizeUsernamePart(persona.last_name);
    const base =
      `${firstInitial}${middleInitial}${lastName}`.slice(0, USERNAME_MAX_LENGTH) || 'user';

    const existingUsers = await this.userRepository.find({
      where: { username: Like(`${base}%`) },
      select: { username: true },
    });
    const existingUsernames = new Set(existingUsers.map((user) => user.username));

    if (!existingUsernames.has(base)) {
      return base;
    }

    let suffix = 1;
    let candidate = `${base}${suffix}`;
    while (existingUsernames.has(candidate) || candidate.length > USERNAME_MAX_LENGTH) {
      suffix += 1;
      const truncatedBase = base.slice(0, USERNAME_MAX_LENGTH - String(suffix).length);
      candidate = `${truncatedBase}${suffix}`;
    }

    return candidate;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: { persona: true, userRoles: true } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id_user: id },
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
      if (existe && existe.id_user !== id) {
        throw new BadRequestException(`El username ${updateUserDto.username} ya está en uso`);
      }
      user.username = updateUserDto.username;
    }
    if (updateUserDto.password) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, SALT_ROUNDS);
    }
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete({ id_user: id });
  }
}
