import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
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
  controllers: [PersonasController, UsersController, UserRoleController],
  providers: [PersonasService, UsersService, UserRoleService],
  exports: [TypeOrmModule],
})
export class PersonasModule {}
