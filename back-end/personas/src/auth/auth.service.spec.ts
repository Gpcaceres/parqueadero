import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../personas/entities/user.entity';
import { Persona } from '../personas/entities/persona.entity';
import { Role } from '../personas/entities/role.entity';
import { UserRole } from '../personas/entities/user-role.entity';
import { EventPublisher } from '../event-publisher.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockUserRepository: any;
  let mockPersonaRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      // generateUniqueUsername() consulta usuarios existentes con un prefijo
      // similar para no chocar de username -- vacío por defecto (sin
      // colisiones) salvo que un test lo sobreescriba.
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockPersonaRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload) => 'test-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Persona),
          useValue: mockPersonaRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
        {
          provide: EventPublisher,
          useValue: { publish: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should validate user with correct password', async () => {
      const user = {
        id_user: '123',
        username: 'galopez11',
        password_hash: 'hashed-password',
        active: true,
        userRoles: [],
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('galopez11', 'password123');

      expect(result).toEqual(expect.objectContaining({ username: 'galopez11' }));
    });

    it('should throw error with incorrect password', async () => {
      const user = {
        id_user: '123',
        username: 'galopez11',
        password_hash: 'hashed-password',
        active: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('galopez11', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const loginDto = { username: 'galopez11', password: 'password123' };
      const user = {
        id_user: '123',
        username: 'galopez11',
        password_hash: 'hashed',
        active: true,
        persona: { email: 'test@example.com' },
        userRoles: [],
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('galopez11');
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const persona = {
        id_persona: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockPersonaRepository.create.mockReturnValue(persona);
      mockPersonaRepository.save.mockResolvedValue(persona);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockReturnValue({ ...registerDto, id_user: '123' });
      mockUserRepository.save.mockResolvedValue({ ...registerDto, id_user: '123' });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    // register() ya no acepta username/email del cliente: los genera solo
    // (generateUniqueUsername, a partir de nombre+apellido) y nunca rechaza
    // por username duplicado -- si la base ya existe, le agrega un sufijo
    // numérico (ver auth.service.ts:177-202) en vez de lanzar una excepción.
    it('should append a numeric suffix when the base username already exists', async () => {
      const registerDto = {
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const persona = { id_persona: '123', first_name: 'John', last_name: 'Doe' };

      // La base para "John Doe" es "jdoe" -- ya existe, así que debe usar
      // "jdoe1".
      mockUserRepository.find.mockResolvedValue([{ username: 'jdoe' }]);
      mockPersonaRepository.create.mockReturnValue(persona);
      mockPersonaRepository.save.mockResolvedValue(persona);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockImplementation((u) => u);
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.register(registerDto);

      expect(result.user.username).toBe('jdoe1');
    });
  });
});
