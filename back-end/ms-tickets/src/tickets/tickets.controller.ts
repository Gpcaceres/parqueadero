import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
  constructor(private readonly ticketsService: TicketsService) {}

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
  async findByEspacio(@Param('id_espacio') id_espacio: string) {
    return await this.ticketsService.findByEspacio(id_espacio);
  }

  @Get('usuario/:id_usuario')
  @ApiOperation({ summary: 'Obtener tickets de un usuario' })
  async findByUsuario(@Param('id_usuario') id_usuario: string) {
    return await this.ticketsService.findByUsuario(id_usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  async findOne(@Param('id') id: string) {
    return await this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un ticket' })
  async update(
    @Param('id') id: string,
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
  async registrarSalida(
    @Param('id') id: string,
    @Body() body: { fecha_salida: Date },
    @Req() req: any,
  ) {
    const id_empleado = this.employeeIdFrom(req.user);
    return await this.ticketsService.registrarSalida(
      id,
      new Date(body.fecha_salida),
      id_empleado,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular un ticket' })
  async anularTicket(
    @Param('id') id: string,
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
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.ticketsService.remove(
      id,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
    return { message: 'Ticket eliminado exitosamente' };
  }
}
