import { Controller, Get, Post, Body, Param, Delete, Patch, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    return this.usersService.create(
      createUserDto,
      normalizarIp(req.ip),
      req.user?.username,
      req.user?.roles?.[0],
    );
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(id, updateUserDto, normalizarIp(req.ip));
  }

  @Patch(':id')
  updateActive(
    @Param('id') id: string,
    @Body('active') active: boolean,
    @Req() req: Request,
  ) {
    return this.usersService.updateActive(id, active, normalizarIp(req.ip));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.remove(id, normalizarIp(req.ip));
  }
}
