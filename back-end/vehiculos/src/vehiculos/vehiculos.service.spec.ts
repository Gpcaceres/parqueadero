import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { Vehiculo } from './entities/vehiculo.entity';
import { EventPublisher } from '../event-publisher.service';

describe('VehiculosService', () => {
  let service: VehiculosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiculosService,
        {
          provide: getRepositoryToken(Vehiculo),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: EventPublisher,
          useValue: { publish: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<VehiculosService>(VehiculosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
