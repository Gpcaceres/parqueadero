import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../personas/entities/role.entity';
import { Permission } from '../../personas/entities/permission.entity';
import { ROLES_CONFIG, PERMISSIONS_CONFIG } from './roles-permissions.seed';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async seedRolesAndPermissions() {
    this.logger.log('🌱 Iniciando seed de roles y permisos...');

    try {
      // 1. Crear permisos
      await this.seedPermissions();

      // 2. Crear roles con permisos
      await this.seedRoles();

      this.logger.log('✅ Seed completado exitosamente');
    } catch (error) {
      this.logger.error(`❌ Error en seed: ${error.message}`);
      throw error;
    }
  }

  private async seedPermissions() {
    this.logger.log('📌 Creando permisos...');

    for (const permConfig of PERMISSIONS_CONFIG) {
      const existing = await this.permissionsRepository.findOne({
        where: { name: permConfig.name },
      });

      if (!existing) {
        await this.permissionsRepository.create({
          name: permConfig.name,
          description: permConfig.description,
          active: true,
        });
        this.logger.debug(`  ✓ Permiso creado: ${permConfig.name}`);
      } else {
        this.logger.debug(`  ⊘ Permiso ya existe: ${permConfig.name}`);
      }
    }

    await this.permissionsRepository.save(
      await this.permissionsRepository.find(),
    );
    this.logger.log(`✅ Permisos creados/verificados`);
  }

  private async seedRoles() {
    this.logger.log('👥 Creando roles...');

    const rolesKeys = Object.keys(ROLES_CONFIG);

    for (const roleKey of rolesKeys) {
      const roleConfig = ROLES_CONFIG[roleKey];
      let role = await this.rolesRepository.findOne({
        where: { name: roleConfig.name },
        relations: { permissions: true },
      });

      if (!role) {
        role = this.rolesRepository.create({
          name: roleConfig.name,
          description: roleConfig.description,
          active: true,
        });
        this.logger.debug(`  ✓ Rol creado: ${roleConfig.name}`);
      } else {
        this.logger.debug(`  ⊘ Rol ya existe: ${roleConfig.name}`);
      }

      // Asignar permisos al rol
      if (roleConfig.permissions.includes('*')) {
        // Super poderes - obtener todos los permisos
        role.permissions = await this.permissionsRepository.find();
      } else {
        const permissions = await this.permissionsRepository.find({
          where: roleConfig.permissions.map((p) => ({ name: p })),
        });
        role.permissions = permissions;
      }

      await this.rolesRepository.save(role);
      this.logger.log(
        `✅ Rol ${roleConfig.name} con ${role.permissions.length} permisos`,
      );
    }
  }
}
