import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditConsumer } from './audit.consumer';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventoAuditoria]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    }),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditConsumer],
})
export class AuditModule {}
