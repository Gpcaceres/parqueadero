import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SeedService } from './seeds/seed.service';
import { User } from '../personas/entities/user.entity';
import { Persona } from '../personas/entities/persona.entity';
import { Role } from '../personas/entities/role.entity';
import { Permission } from '../personas/entities/permission.entity';
import { UserRole } from '../personas/entities/user-role.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-this',
        signOptions: {
          expiresIn: Number(
            configService.get<string>('JWT_EXPIRES_IN') || '86400',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Persona, Role, Permission, UserRole]),
  ],
  providers: [AuthService, JwtStrategy, SeedService],
  controllers: [AuthController],
  exports: [AuthService, SeedService],
})
export class AuthModule {}
