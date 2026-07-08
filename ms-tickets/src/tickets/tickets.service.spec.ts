import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { Ticket, EstadoTicket } from './entities/ticket.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TicketsService', () => {
  let service: TicketsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket', () => {
    it('should create a new ticket', async () => {
      const createTicketDto = {
        id_espacio: '550e8400-e29b-41d4-a716-446655440000',
        id_usuario: '550e8400-e29b-41d4-a716-446655440001',
        id_vehiculo: 'ABC-123',
        tipo_vehiculo: 'auto',
        fecha_hora_ingreso: new Date(),
      };

      const expectedTicket = {
        id_ticket: 1,
        ...createTicketDto,
        estado_ticket: EstadoTicket.ACTIVO,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(expectedTicket);
      mockRepository.save.mockResolvedValue(expectedTicket);

      const result = await service.createTicket(createTicketDto);

      expect(result).toEqual(expectedTicket);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTicket);
    });

    it('should throw BadRequestException if space is already occupied', async () => {
      const createTicketDto = {
        id_espacio: '550e8400-e29b-41d4-a716-446655440000',
        id_usuario: '550e8400-e29b-41d4-a716-446655440001',
        id_vehiculo: 'ABC-123',
        tipo_vehiculo: 'auto',
        fecha_hora_ingreso: new Date(),
      };

      mockRepository.findOne.mockResolvedValue({ id_ticket: 1 });

      await expect(service.createTicket(createTicketDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a ticket by id', async () => {
      const ticket = {
        id_ticket: 1,
        id_espacio: '550e8400-e29b-41d4-a716-446655440000',
      };

      mockRepository.findOneBy.mockResolvedValue(ticket);

      const result = await service.findOne(1);

      expect(result).toEqual(ticket);
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('obtenerEstadisticas', () => {
    it('should return statistics', async () => {
      mockRepository.count.mockResolvedValue(5);
      mockRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 1000 }),
      });

      const result = await service.obtenerEstadisticas();

      expect(result).toHaveProperty('activos');
      expect(result).toHaveProperty('pagados');
      expect(result).toHaveProperty('anulados');
      expect(result).toHaveProperty('totalRecaudado');
    });
  });
});
