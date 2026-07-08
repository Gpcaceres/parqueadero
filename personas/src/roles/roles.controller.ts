import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

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
}
