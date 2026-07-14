import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const WRITE_ROLES = ['admin', 'root', 'recaudador'];

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

@Controller('vehiculos')
@UseGuards(OptionalAuthGuard)
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...WRITE_ROLES)
  create(@Body() createVehiculoDto: CreateVehiculoDto, @Req() req: any) {
    return this.vehiculosService.createVehiculo(
      createVehiculoDto,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Get()
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...WRITE_ROLES)
  update(
    @Param('id') id: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
    @Req() req: any,
  ) {
    return this.vehiculosService.update(
      id,
      updateVehiculoDto,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...WRITE_ROLES)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.vehiculosService.remove(
      id,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }
}
