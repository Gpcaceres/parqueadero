import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { ZoneIntegrationService } from './zone-integration.service';
import { PersonaIntegrationService } from './persona-integration.service';
import { EventPublisher } from '../event-publisher.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    }),
    SseModule,
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    OptionalAuthGuard,
    ZoneIntegrationService,
    PersonaIntegrationService,
    EventPublisher,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
