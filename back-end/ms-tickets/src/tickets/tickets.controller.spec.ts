import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PersonaIntegrationService } from './persona-integration.service';
import { Ticket, EstadoTicket, TipoTarifa } from './entities/ticket.entity';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

// Los guards reales (OptionalAuthGuard/JwtAuthGuard/RolesGuard) dependen de
// JwtService/Reflector -- en un test unitario del controller no se prueba
// autenticación, así que se reemplazan por un no-op (patrón recomendado por
// NestJS: overrideGuard) en vez de reconstruir toda su cadena de DI.
const allowGuard = { canActivate: () => true };

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

// Simula el request que Express/Nest inyecta con @Req() -- el controlador
// solo lee req.ip y req.user (ver TicketsController.employeeIdFrom).
const mockRequest = (overrides: Record<string, any> = {}) => ({
  ip: '127.0.0.1',
  user: { id_user: '550e8400-e29b-41d4-a716-446655440002', username: 'admin', roles: ['admin'] },
  ...overrides,
});

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
        {
          provide: PersonaIntegrationService,
          useValue: {
            obtenerNombreCompleto: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(OptionalAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .compile();

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
        tipo_tarifa: TipoTarifa.POR_HORA,
      };

      const expectedResult = mockTicket({ ...createTicketDto });

      jest.spyOn(service, 'createTicket').mockResolvedValue(expectedResult);

      const result = await controller.create(createTicketDto, mockRequest());

      expect(result).toEqual(expectedResult);
      expect(service.createTicket).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of tickets', async () => {
      const tickets = [mockTicket()];

      jest.spyOn(service, 'findAll').mockResolvedValue(tickets);

      const result = await controller.findAll();

      expect(result).toEqual(tickets);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single ticket', async () => {
      const ticket = mockTicket();

      jest.spyOn(service, 'findOne').mockResolvedValue(ticket);

      const result = await controller.findOne(ticket.id_ticket);

      expect(result).toEqual(ticket);
      expect(service.findOne).toHaveBeenCalledWith(ticket.id_ticket);
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
