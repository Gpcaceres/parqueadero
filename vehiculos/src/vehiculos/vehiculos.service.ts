import { Injectable } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Repository } from 'typeorm';
import { Vehiculo, Clasificacion } from './entities/vehiculo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FactoryVehiculos } from './factory/factory-vehiculo';
import { EventPublisher, AuditEvent } from '../event-publisher.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async createVehiculo(
    createVehiculoDto: CreateVehiculoDto,
    ip?: string,
  ): Promise<Vehiculo> {
    const exist = await this.vehiculoRepository.findOneBy({
      placa: createVehiculoDto.datos.placa,
    });

    if (exist) {
      throw new Error('El vehiculo ya existe');
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    vehiculo.clasificacion =
      (createVehiculoDto.datos.clasificacion as Clasificacion) ||
      Clasificacion.GASOLINA;

    const saved = await this.vehiculoRepository.save(vehiculo);
    await this.emitEvent('CREATE', saved, undefined, ip);

    return saved;
  }

  async findAll(): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find();
  }

  async findOne(id: string): Promise<Vehiculo> {
    const existe = await this.vehiculoRepository.findOne({
      where: { id_vehiculo: id },
    });

    if (!existe) {
      throw new Error('El vehiculo no existe');
    }
    return existe;
  }

  async update(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
    ip?: string,
  ): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);

    if (updateVehiculoDto.datos) {
      Object.assign(vehiculo, updateVehiculoDto.datos);
    }

    const saved = await this.vehiculoRepository.save(vehiculo);
    await this.emitEvent('UPDATE', saved, undefined, ip);

    return saved;
  }

  async remove(id: string, ip?: string): Promise<void> {
    const vehiculo = await this.findOne(id);
    await this.vehiculoRepository.remove(vehiculo);
    await this.emitEvent('DELETE', vehiculo, undefined, ip);
  }

  // Método auxiliar para publicar eventos
  private async emitEvent(
    accion: string,
    vehiculo: Vehiculo,
    datosExtra?: Record<string, any>,
    ip?: string,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-vehiculos',
      accion,
      entidad: 'VEHICULO',
      datos: { ...vehiculo, ...datosExtra },
      ip,
      // usuario se podría obtener del contexto (request) si se inyecta auth
    };
    await this.eventPublisher.publish(event);
  }
}
