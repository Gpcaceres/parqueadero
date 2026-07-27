import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';

describe('AuditService', () => {
  let service: AuditService;
  let mockRepository: any;

  const mockDto: CreateAuditEventDto = {
    servicio: 'ms-tickets',
    accion: 'CREATE',
    entidad: 'TICKET',
    datos: { id_ticket: '1' },
    usuario: 'jperez',
    rol: 'admin',
    ip: '127.0.0.1',
    mac: '00:1B:44:11:3A:B7',
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(EventoAuditoria), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe mapear el DTO (accion -> action, usuario -> username) y guardar el evento', async () => {
      const entidadCreada = { id: 'evt-1', ...mockDto };
      mockRepository.create.mockReturnValue(entidadCreada);
      mockRepository.save.mockResolvedValue(entidadCreada);

      const result = await service.create(mockDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        servicio: mockDto.servicio,
        action: mockDto.accion,
        entidad: mockDto.entidad,
        datos: mockDto.datos,
        username: mockDto.usuario,
        rol: mockDto.rol,
        ip: mockDto.ip,
        mac: mockDto.mac,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(entidadCreada);
      expect(result).toEqual(entidadCreada);
    });
  });

  describe('findAll', () => {
    it('debe devolver los eventos ordenados por timestamp descendente', async () => {
      const eventos = [{ id: 'evt-1' }, { id: 'evt-2' }];
      mockRepository.find.mockResolvedValue(eventos);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(eventos);
    });
  });

  describe('findOne', () => {
    it('debe devolver null si el evento no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('no-existe');

      expect(result).toBeNull();
    });
  });
});
