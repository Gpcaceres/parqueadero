import { Test, TestingModule } from '@nestjs/testing';
import { PersonasController } from './personas.controller';
import { PersonasService } from './personas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// Los guards reales dependen de JwtService/Reflector -- en un test unitario
// del controller no se prueba autenticación, así que se reemplazan por un
// no-op (patrón overrideGuard recomendado por NestJS).
const allowGuard = { canActivate: () => true };

describe('PersonasController', () => {
  let controller: PersonasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonasController],
      providers: [
        {
          provide: PersonasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get<PersonasController>(PersonasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
