import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRoleService } from './user-role.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

@Controller('user-role')
@UseGuards(JwtAuthGuard)
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post()
  create(@Request() req, @Body() createUserRoleDto: CreateUserRoleDto) {
    return this.userRoleService.assignRole(
      createUserRoleDto,
      req.user.roles || [],
      req.user.username,
      normalizarIp(req.ip),
    );
  }

  @Get(':id_user')
  findByUser(@Param('id_user') idUser: string) {
    return this.userRoleService.findByUser(idUser);
  }

  @Patch(':id_user/:id_role')
  setActive(
    @Request() req,
    @Param('id_user') idUser: string,
    @Param('id_role') idRole: string,
    @Body('active') active: boolean,
  ) {
    return this.userRoleService.setActive(
      idUser,
      idRole,
      active,
      req.user.roles || [],
      req.user.username,
      normalizarIp(req.ip),
    );
  }

  @Delete(':id_user/:id_role')
  remove(@Request() req, @Param('id_user') idUser: string, @Param('id_role') idRole: string) {
    return this.userRoleService.removeRole(
      idUser,
      idRole,
      req.user.roles || [],
      req.user.username,
      normalizarIp(req.ip),
    );
  }
}
