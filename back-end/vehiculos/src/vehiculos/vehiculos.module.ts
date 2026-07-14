import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Auto } from './entities/auto.entity';
import { Motocicleta } from './entities/motocicleta.entity';
import { Camioneta } from './entities/camioneta.entity';
import { EventPublisher } from '../event-publisher.service';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehiculo, Auto, Motocicleta, Camioneta]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    }),
  ],
  controllers: [VehiculosController],
  providers: [VehiculosService, EventPublisher, OptionalAuthGuard],
  exports: [VehiculosService, EventPublisher],
})
export class VehiculosModule {}
