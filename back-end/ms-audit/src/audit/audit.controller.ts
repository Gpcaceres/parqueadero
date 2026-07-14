import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Los eventos de auditoría llegan por RabbitMQ (ver AuditConsumer); este
// endpoint HTTP existe solo para pruebas manuales, así que se restringe
// igual que las lecturas: solo admin/root pueden usarlo.
const AUDIT_ROLES = ['admin', 'root'];

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...AUDIT_ROLES)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Body() createAuditEventDto: CreateAuditEventDto) {
    return this.auditService.create(createAuditEventDto);
  }

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
