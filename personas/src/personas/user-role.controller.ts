import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Controller('user-role')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post()
  create(@Body() createUserRoleDto: CreateUserRoleDto) {
    return this.userRoleService.assignRole(createUserRoleDto);
  }

  @Get(':id_user')
  findByUser(@Param('id_user') idUser: string) {
    return this.userRoleService.findByUser(idUser);
  }

  @Delete(':id_user/:id_role')
  remove(@Param('id_user') idUser: string, @Param('id_role') idRole: string) {
    return this.userRoleService.removeRole(idUser, idRole);
  }
}
