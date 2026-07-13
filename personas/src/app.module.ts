import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasModule } from './personas/personas.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { EventPublisherModule } from './event-publisher.module';
import { Persona } from './personas/entities/persona.entity';
import { User } from './personas/entities/user.entity';
import { Role } from './personas/entities/role.entity';
import { UserRole } from './personas/entities/user-role.entity';
import { Permission } from './personas/entities/permission.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventPublisherModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USUARIO'),
        password: configService.get('DB_CONTRASENA'),
        database: configService.get('DB_NOMBRE'),
        entities: [Persona, User, Role, UserRole, Permission],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    RolesModule,
    PersonasModule,
  ],
})
export class AppModule {}
