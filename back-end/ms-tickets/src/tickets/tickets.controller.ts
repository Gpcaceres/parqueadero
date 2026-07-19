import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  AuthenticatedUser,
  EMPLOYEE_ROLES,
  OptionalAuthGuard,
} from '../auth/optional-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PersonaIntegrationService } from './persona-integration.service';

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(OptionalAuthGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly personaIntegrationService: PersonaIntegrationService,
  ) {}

  /**
   * Si la request viene autenticada con un rol "empleado" (admin, recaudador,
   * root), devuelve su id_user para usar como id_empleado -- así ese campo
   * refleja quién está logeado/realizó la acción, en vez de un valor que el
   * cliente escriba a mano en el body.
   */
  private employeeIdFrom(user?: AuthenticatedUser): string | undefined {
    if (user && user.roles?.some((role) => EMPLOYEE_ROLES.includes(role))) {
      return user.id_user;
    }
    return undefined;
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo ticket' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  async create(@Body() createTicketDto: CreateTicketDto, @Req() req: any) {
    const id_empleado = this.employeeIdFrom(req.user);
    if (id_empleado) {
      createTicketDto.id_empleado = id_empleado;
    }
    return await this.ticketsService.createTicket(
      createTicketDto,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tickets' })
  async findAll() {
    return await this.ticketsService.findAll();
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de tickets' })
  async obtenerEstadisticas() {
    return await this.ticketsService.obtenerEstadisticas();
  }

  @Get('espacio/:id_espacio')
  @ApiOperation({ summary: 'Obtener ticket activo por espacio' })
  async findByEspacio(@Param('id_espacio', ParseUUIDPipe) id_espacio: string) {
    const ticket = await this.ticketsService.findByEspacio(id_espacio);
    if (!ticket) {
      return ticket;
    }
    // Se enriquece con el nombre del usuario para mostrarlo en el dashboard
    // (el propio ticket solo guarda id_usuario); ver PersonaIntegrationService.
    const nombre_usuario = await this.personaIntegrationService.obtenerNombreCompleto(
      ticket.id_usuario,
    );
    return { ...ticket, nombre_usuario };
  }

  @Get('usuario/:id_usuario')
  @ApiOperation({ summary: 'Obtener tickets de un usuario' })
  async findByUsuario(@Param('id_usuario', ParseUUIDPipe) id_usuario: string) {
    return await this.ticketsService.findByUsuario(id_usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un ticket' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() req: any,
  ) {
    const id_empleado = this.employeeIdFrom(req.user);
    if (id_empleado) {
      updateTicketDto.id_empleado = id_empleado;
    }
    return await this.ticketsService.update(
      id,
      updateTicketDto,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Patch(':id/salida')
  @ApiOperation({ summary: 'Registrar salida del vehículo' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  async registrarSalida(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    // fecha_hora_salida se captura con la hora del servidor en el momento en
    // que se procesa la salida (ver TicketsService.registrarSalida); no se
    // acepta del body, para que la sincronización del espacio a DISPONIBLE
    // siempre corresponda al instante real en que ocurrió la acción.
    const id_empleado = this.employeeIdFrom(req.user);
    return await this.ticketsService.registrarSalida(
      id,
      id_empleado,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular un ticket' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  async anularTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo?: string },
    @Req() req: any,
  ) {
    return await this.ticketsService.anularTicket(
      id,
      body.motivo,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un ticket' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EMPLOYEE_ROLES)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    await this.ticketsService.remove(
      id,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
    return { message: 'Ticket eliminado exitosamente' };
  }
}
