import { Controller, Get, Post, Delete, Param, UseGuards, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRoleDto } from '../personas/dto/create-role.dto';

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  async create(@Body() createRoleDto: CreateRoleDto, @Req() req: any) {
    return await this.rolesService.create(
      createRoleDto,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  async findAll() {
    return await this.rolesService.findAll();
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los permisos disponibles' })
  async getAllPermissions() {
    return await this.rolesService.getAllPermissions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener rol por ID' })
  async findOne(@Param('id') id: string) {
    return await this.rolesService.findOne(id);
  }

  @Get(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener permisos de un rol' })
  async getPermissionsByRole(@Param('id') roleId: string) {
    return await this.rolesService.getPermissionsByRole(roleId);
  }

  @Post(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('root')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar permisos a un rol' })
  async assignPermissionsToRole(
    @Param('id') roleId: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return await this.rolesService.assignPermissionsToRole(
      roleId,
      body.permissionIds,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un rol' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.rolesService.remove(
      id,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }
}
