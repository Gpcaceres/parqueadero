import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { Ticket, EstadoTicket, TipoTarifa } from './entities/ticket.entity';
import { ZoneIntegrationService } from './zone-integration.service';
import { EventPublisher } from '../event-publisher.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id_ticket: '550e8400-e29b-41d4-a716-446655440099',
  id_espacio: '550e8400-e29b-41d4-a716-446655440000',
  id_usuario: '550e8400-e29b-41d4-a716-446655440001',
  id_vehiculo: 'ABC-123',
  tipo_vehiculo: 'auto',
  fecha_hora_ingreso: new Date(),
  fecha_hora_salida: null as unknown as Date,
  estado_ticket: EstadoTicket.ACTIVO,
  tipo_tarifa: TipoTarifa.POR_HORA,
  id_empleado: null as unknown as string,
  valor_recaudado: null as unknown as number,
  ...overrides,
});

describe('TicketsService', () => {
  let service: TicketsService;
  let mockRepository: any;
  let mockZoneIntegration: any;
  let mockEventPublisher: any;

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
    mockZoneIntegration = {
      marcarOcupado: jest.fn().mockResolvedValue(undefined),
    };
    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: mockRepository },
        { provide: ZoneIntegrationService, useValue: mockZoneIntegration },
        { provide: EventPublisher, useValue: mockEventPublisher },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket', () => {
    const createTicketDto = {
      id_espacio: '550e8400-e29b-41d4-a716-446655440000',
      id_usuario: '550e8400-e29b-41d4-a716-446655440001',
      id_vehiculo: 'ABC-123',
      tipo_vehiculo: 'auto',
      tipo_tarifa: TipoTarifa.POR_HORA,
    };

    it('should create a new ticket', async () => {
      const expectedTicket = mockTicket({ ...createTicketDto });

      // El servicio hace dos findOne: (1) el espacio ya tiene ticket activo,
      // (2) el vehiculo ya esta dentro con otro ticket activo -- ambos null
      // en el camino feliz.
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(expectedTicket);
      mockRepository.save.mockResolvedValue(expectedTicket);

      const result = await service.createTicket(createTicketDto);

      expect(result).toEqual(expectedTicket);
      expect(mockZoneIntegration.marcarOcupado).toHaveBeenCalledWith(
        expectedTicket.id_espacio,
      );
      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });

    it('should throw BadRequestException if space is already occupied', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockTicket());

      await expect(service.createTicket(createTicketDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if vehicle is already inside', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null); // espacio libre
      mockRepository.findOne.mockResolvedValueOnce(mockTicket()); // vehiculo dentro

      await expect(service.createTicket(createTicketDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a ticket by id', async () => {
      const ticket = mockTicket();
      mockRepository.findOneBy.mockResolvedValue(ticket);

      const result = await service.findOne(ticket.id_ticket);

      expect(result).toEqual(ticket);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id_ticket: ticket.id_ticket,
      });
    });

    it('should throw NotFoundException if ticket not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.findOne('550e8400-e29b-41d4-a716-446655449999'),
      ).rejects.toThrow(NotFoundException);
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
