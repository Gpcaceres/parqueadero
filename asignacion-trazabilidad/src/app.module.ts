import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Assignment } from './entities/assignment.entity';
import { AuditTrail } from './entities/audit-trail.entity';

// Repositories
import { AssignmentRepository } from './repositories/assignment.repository';
import { AuditTrailRepository } from './repositories/audit-trail.repository';

// Services
import { AssignmentService } from './services/assignment.service';
import { AuditService } from './services/audit.service';
import { VehicleIntegrationService } from './services/vehicle-integration.service';
import { UserIntegrationService } from './services/user-integration.service';
import { ZoneIntegrationService } from './services/zone-integration.service';

// Controllers
import { AssignmentController } from './controllers/assignment.controller';

/**
 * Module: App
 * Módulo principal de la aplicación
 *
 * Configura:
 * - Conexión a BD PostgreSQL
 * - Entidades y Repositorios
 * - Servicios de negocio
 * - Controladores REST
 * - Integración HTTP con otros servicios
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'asignacion_db',
      entities: [Assignment, AuditTrail],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.DB_LOGGING === 'true',
    }),
    TypeOrmModule.forFeature([Assignment, AuditTrail]),
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  controllers: [AssignmentController],
  providers: [
    AssignmentRepository,
    AuditTrailRepository,
    AssignmentService,
    AuditService,
    VehicleIntegrationService,
    UserIntegrationService,
    ZoneIntegrationService,
  ],
  exports: [
    AssignmentService,
    AuditService,
    VehicleIntegrationService,
    UserIntegrationService,
    ZoneIntegrationService,
  ],
})
export class AppModule {}
