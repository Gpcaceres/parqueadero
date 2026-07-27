import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { Persona } from './entities/persona.entity';
import { EventPublisher } from '../event-publisher.service';

describe('PersonasService', () => {
  let service: PersonasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonasService,
        {
          provide: getRepositoryToken(Persona),
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

    service = module.get<PersonasService>(PersonasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
