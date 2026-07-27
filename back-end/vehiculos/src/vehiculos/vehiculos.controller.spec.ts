import { Test, TestingModule } from '@nestjs/testing';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

// Los guards reales dependen de JwtService/Reflector -- en un test unitario
// del controller no se prueba autenticación, así que se reemplazan por un
// no-op (patrón overrideGuard recomendado por NestJS).
const allowGuard = { canActivate: () => true };

describe('VehiculosController', () => {
  let controller: VehiculosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiculosController],
      providers: [
        {
          provide: VehiculosService,
          useValue: {
            createVehiculo: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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

    controller = module.get<VehiculosController>(VehiculosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
