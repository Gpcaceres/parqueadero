import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { Reserva } from './entities/reserva.entity';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reserva]),
    // JwtAuthGuard resuelve JwtService por DI del módulo -- mismo secreto
    // que el resto del servicio, igual que en tickets.module.ts.
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    }),
    TicketsModule, // reusa ZoneIntegrationService, ya exportado desde ahí
  ],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
