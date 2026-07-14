import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: {
            createTicket: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByEspacio: jest.fn(),
            findByUsuario: jest.fn(),
            update: jest.fn(),
            registrarSalida: jest.fn(),
            anularTicket: jest.fn(),
            remove: jest.fn(),
            obtenerEstadisticas: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ticket', async () => {
      const createTicketDto = {
        id_espacio: '550e8400-e29b-41d4-a716-446655440000',
        id_usuario: '550e8400-e29b-41d4-a716-446655440001',
        id_vehiculo: 'ABC-123',
        tipo_vehiculo: 'auto',
        fecha_hora_ingreso: new Date(),
      };

      const expectedResult = { id_ticket: 1, ...createTicketDto };

      jest.spyOn(service, 'createTicket').mockResolvedValue(expectedResult);

      const result = await controller.create(createTicketDto);

      expect(result).toEqual(expectedResult);
      expect(service.createTicket).toHaveBeenCalledWith(createTicketDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tickets', async () => {
      const tickets = [
        {
          id_ticket: 1,
          id_espacio: '550e8400-e29b-41d4-a716-446655440000',
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(tickets);

      const result = await controller.findAll();

      expect(result).toEqual(tickets);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single ticket', async () => {
      const ticket = { id_ticket: 1 };

      jest.spyOn(service, 'findOne').mockResolvedValue(ticket);

      const result = await controller.findOne('1');

      expect(result).toEqual(ticket);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('should return statistics', async () => {
      const stats = {
        activos: 10,
        pagados: 50,
        anulados: 2,
        total: 62,
        totalRecaudado: 500000,
      };

      jest.spyOn(service, 'obtenerEstadisticas').mockResolvedValue(stats);

      const result = await controller.obtenerEstadisticas();

      expect(result).toEqual(stats);
    });
  });
});
