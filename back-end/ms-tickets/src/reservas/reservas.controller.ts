import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser, EMPLOYEE_ROLES } from '../auth/optional-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PersonaIntegrationService } from '../tickets/persona-integration.service';

@ApiTags('reservas')
@Controller('reservas')
export class ReservasController {
  constructor(
    private readonly reservasService: ReservasService,
    private readonly personaIntegrationService: PersonaIntegrationService,
  ) {}

  // Reservar para uno mismo no es una acción de personal (a diferencia de
  // crear un ticket): cualquier usuario autenticado puede reservar, sin
  // exigir un rol específico -- solo JwtAuthGuard, sin RolesGuard.
  @Post()
  @ApiOperation({ summary: 'Reservar un espacio disponible' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReservaDto, @Req() req: { user: AuthenticatedUser }) {
    return await this.reservasService.crearReserva(dto, req.user.id_user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las reservas' })
  async findAll() {
    return await this.reservasService.findAll();
  }

  @Get('usuario/:id_usuario')
  @ApiOperation({ summary: 'Reservas de un usuario' })
  async findByUsuario(@Param('id_usuario', ParseUUIDPipe) idUsuario: string) {
    return await this.reservasService.findByUsuario(idUsuario);
  }

  @Get('espacio/:id_espacio')
  @ApiOperation({ summary: 'Reserva activa de un espacio, con el contacto de quien reservó' })
  async findByEspacio(@Param('id_espacio', ParseUUIDPipe) idEspacio: string) {
    const reserva = await this.reservasService.findByEspacio(idEspacio);
    if (!reserva) {
      return reserva;
    }
    // Se enriquece con el contacto de quien reservó para que el personal
    // pueda ubicarlo si hace falta (ver dashboard, tarjeta RESERVADO).
    const contacto = await this.personaIntegrationService.obtenerContacto(reserva.id_usuario);
    return { ...reserva, contacto };
  }

  // Cancelar la reserva de otra persona es una acción de personal (a
  // diferencia de crearla) -- mismo set de roles que ya opera
  // tickets/vehículos/zonas (ver EMPLOYEE_ROLES).
  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una reserva y liberar el espacio' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  async cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return await this.reservasService.cancelarReserva(id);
  }
}
