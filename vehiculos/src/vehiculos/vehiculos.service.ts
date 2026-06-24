import { Injectable } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Repository } from 'typeorm';
import { Vehiculo, Clasificacion } from './entities/vehiculo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FactoryVehiculos } from './factory/factory-vehiculo';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
  ) {}

  async createVehiculo(
    createVehiculoDto: CreateVehiculoDto,
  ): Promise<Vehiculo> {
    const exist = await this.vehiculoRepository.findOneBy({
      placa: createVehiculoDto.datos.placa,
    });

    if (exist) {
      throw new Error('El vehiculo ya existe');
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    vehiculo.clasificacion = (createVehiculoDto.datos.clasificacion as Clasificacion) || Clasificacion.GASOLINA;
    return this.vehiculoRepository.save(vehiculo);
  }

  async findAll(): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find();
  }

  async findOne(id: number): Promise<Vehiculo> {
    const existe = await this.vehiculoRepository.findOne({
      where: { id: id }
    });

    if (!existe) {
      throw new Error('El vehiculo no existe');
    }
    return existe;
  }


  update(id: number, updateVehiculoDto: UpdateVehiculoDto) {
    return `This action updates a #${id} vehiculo`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehiculo`;
  }
}
