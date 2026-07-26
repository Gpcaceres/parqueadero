import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TicketsModule } from './tickets/tickets.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { ReservasModule } from './reservas/reservas.module';
import { Reserva } from './reservas/entities/reserva.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SseModule } from './sse/sse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USUARIO'),
        password: configService.get('DB_CONTRASENA'),
        database: configService.get('DB_NOMBRE'),
        entities: [Ticket, Reserva],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    // Habilita @Interval/@Cron -- lo usa ReservasService para liberar
    // reservas vencidas (ver liberarExpiradas).
    ScheduleModule.forRoot(),
    TicketsModule,
    ReservasModule,
    SseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
