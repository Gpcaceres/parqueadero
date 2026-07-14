import { Persona } from '../entities/persona.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreatePersonaDto } from '../dto/create-persona.dto';
import { CreateRoleDto } from '../dto/create-role.dto';

export enum TipoRol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  CLIENTE = 'CLIENTE',
  OPERADOR = 'OPERADOR',
  ROOT = 'ROOT',
  RECAUDADOR = 'RECAUDADOR',
}

const configuracionRoles: Record<
  TipoRol,
  { name: string; description: string }
> = {
  [TipoRol.ADMINISTRADOR]: {
    name: 'ADMINISTRADOR',
    description: 'Acceso total al sistema de parqueadero',
  },
  [TipoRol.CLIENTE]: {
    name: 'CLIENTE',
    description: 'Usuario que utiliza los servicios del parqueadero',
  },
  [TipoRol.OPERADOR]: {
    name: 'OPERADOR',
    description: 'Gestiona el ingreso y salida de vehículos',
  },
  [TipoRol.ROOT]: {
    name: 'ROOT',
    description: 'Super administrador con todos los permisos',
  },
  [TipoRol.RECAUDADOR]: {
    name: 'RECAUDADOR',
    description: 'Recaudador de pagos',
  },
};

export class FactoryPersonas {
  static crearPersona(dto: CreatePersonaDto): Persona {
    const persona = new Persona();
    Object.assign(persona, dto);
    persona.active = true;
    return persona;
  }

  static crearUsuario(idUser: string, username: string, passwordHash: string): User {
    const user = new User();
    user.id_user = idUser;
    user.username = username;
    user.password_hash = passwordHash;
    user.active = true;
    return user;
  }

  static crearRol(dto: CreateRoleDto): Role {
    const config = configuracionRoles[dto.tipo];
    if (!config) {
      throw new Error(`Tipo de rol no soportado: ${dto.tipo}`);
    }
    const role = new Role();
    role.name = config.name;
    role.description = dto.description ?? config.description;
    role.active = true;
    return role;
  }
}
