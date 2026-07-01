import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRoleController } from './user-role.controller';
import { UserRoleService } from './user-role.service';
import { Persona } from './entities/persona.entity';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Persona, User, Role, UserRole])],
  controllers: [PersonasController, RolesController, UsersController, UserRoleController],
  providers: [PersonasService, RolesService, UsersService, UserRoleService],
  exports: [TypeOrmModule],
})
export class PersonasModule {}
