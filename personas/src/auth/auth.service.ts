import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../personas/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Persona } from '../personas/entities/persona.entity';
import { Role } from '../personas/entities/role.entity';
import { UserRole } from '../personas/entities/user-role.entity';
import { v4 as uuidv4 } from 'uuid';
import { EventPublisher, AuditEvent } from '../event-publisher.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Persona)
    private personasRepository: Repository<Persona>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
    private jwtService: JwtService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  private async emitEvent(
    accion: string,
    username: string,
    ip?: string,
    datosExtra?: Record<string, any>,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-personas',
      accion,
      entidad: 'USUARIO',
      datos: datosExtra,
      usuario: username,
      ip,
    };
    await this.eventPublisher.publish(event);
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: { persona: true, userRoles: { role: true } },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario no vÃ¡lido o inactivo');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('ContraseÃ±a incorrecta');
    }

    user.last_login = new Date();
    await this.usersRepository.save(user);

    return user;
  }

  async login(loginDto: LoginDto, ip?: string) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    const activeRoleNames = this.getActiveRoleNames(user);

    await this.emitEvent('LOGIN', user.username, ip, { roles: activeRoleNames });

    const payload = {
      sub: user.id_user,
      username: user.username,
      email: user.persona?.email,
      roles: activeRoleNames,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id_user: user.id_user,
        username: user.username,
        email: user.persona?.email,
        firstName: user.persona?.first_name,
        lastName: user.persona?.last_name,
        roles: activeRoleNames,
      },
    };
  }

  async register(registerDto: RegisterDto, ip?: string) {
    const username = await this.generateUniqueUsername(
      registerDto.firstName,
      registerDto.lastName,
    );
    const email = `${username}@test.com`;

    // 1. Crear Persona
    const persona = this.personasRepository.create({
      id_persona: uuidv4(),
      first_name: registerDto.firstName,
      last_name: registerDto.lastName,
      email,
      phone: registerDto.phone,
    });

    await this.personasRepository.save(persona);

    // 2. Crear User
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      id_user: persona.id_persona,
      username,
      password_hash: passwordHash,
      persona,
      active: true,
    });

    await this.usersRepository.save(user);

    // 3. Asignar rol "cliente" automáticamente
    const clienteRole = await this.rolesRepository.findOne({
      where: { name: 'cliente' },
    });

    if (clienteRole) {
      const userRole = this.userRolesRepository.create({
        user,
        role: clienteRole,
      });
      await this.userRolesRepository.save(userRole);
    }

    await this.emitEvent('CREATE', user.username, ip, {
      id_user: user.id_user,
      roles: ['cliente'],
    });

    const payload = {
      sub: user.id_user,
      username: user.username,
      email: user.persona?.email,
      roles: ['cliente'],
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id_user: user.id_user,
        username: user.username,
        email: user.persona?.email,
        firstName: user.persona?.first_name,
        lastName: user.persona?.last_name,
        roles: ['cliente'],
      },
    };
  }

  private normalizeUsernamePart(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private async generateUniqueUsername(
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const prefix = this.normalizeUsernamePart(firstName.charAt(0));
    const suffixPart = this.normalizeUsernamePart(lastName);
    const base = `${prefix}${suffixPart}`.slice(0, 15) || 'user';

    const existingUsers = await this.usersRepository.find({
      where: { username: Like(`${base}%`) },
      select: { username: true },
    });

    const existingUsernames = new Set(
      existingUsers.map((user) => user.username),
    );
    if (!existingUsernames.has(base)) {
      return base;
    }

    let suffix = 1;
    let candidate = `${base}${suffix}`;
    while (existingUsernames.has(candidate) || candidate.length > 15) {
      suffix += 1;
      const truncatedBase = base.slice(0, 15 - String(suffix).length);
      candidate = `${truncatedBase}${suffix}`;
    }

    return candidate;
  }

  async refreshToken(user: any) {
    const payload = {
      sub: user.id_user,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Token invÃ¡lido o expirado');
    }
  }

  private getActiveRoleNames(user: User): string[] {
    return (user.userRoles || [])
      .filter((ur) => ur.active)
      .map((ur) => ur.role?.name)
      .filter((name): name is string => !!name);
  }
}

