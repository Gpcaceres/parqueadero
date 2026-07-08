import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { FactoryPersonas } from './factory/factory-personas';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  async create(createPersonaDto: CreatePersonaDto): Promise<Persona> {
    const porDni = await this.personaRepository.findOneBy({ dni: createPersonaDto.dni });
    if (porDni) {
      throw new BadRequestException(`Ya existe una persona con DNI ${createPersonaDto.dni}`);
    }
    const porEmail = await this.personaRepository.findOneBy({ email: createPersonaDto.email });
    if (porEmail) {
      throw new BadRequestException(`El correo ${createPersonaDto.email} ya está registrado`);
    }
    const persona = FactoryPersonas.crearPersona(createPersonaDto);
    return this.personaRepository.save(persona);
  }

  async findAll(): Promise<Persona[]> {
    return this.personaRepository.find();
  }

  async findOne(id: string): Promise<Persona> {
    const persona = await this.personaRepository.findOneBy({ id });
    if (!persona) {
      throw new NotFoundException(`Persona con id ${id} no encontrada`);
    }
    return persona;
  }

  async update(id: string, updatePersonaDto: UpdatePersonaDto): Promise<Persona> {
    await this.personaRepository.update(id, updatePersonaDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.personaRepository.delete(id);
  }
}
