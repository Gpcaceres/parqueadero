import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  create(@Body() createPersonaDto: CreatePersonaDto, @Req() req: any) {
    return this.personasService.create(
      createPersonaDto,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Get()
  findAll() {
    return this.personasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePersonaDto: UpdatePersonaDto,
    @Req() req: Request,
  ) {
    return this.personasService.update(id, updatePersonaDto, normalizarIp(req.ip));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.personasService.remove(id, normalizarIp(req.ip));
  }
}
