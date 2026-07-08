import { Controller, Post, Body, UseGuards, Request, Get, Req } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login de usuario' })
  async login(@Body() loginDto: LoginDto, @Req() req: ExpressRequest) {
    return await this.authService.login(loginDto, normalizarIp(req.ip));
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de nuevo usuario' })
  async register(@Body() registerDto: RegisterDto, @Req() req: ExpressRequest) {
    return await this.authService.register(registerDto, normalizarIp(req.ip));
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refrescar token JWT' })
  async refresh(@Request() req) {
    return await this.authService.refreshToken(req.user);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar token JWT' })
  async verify(@Request() req) {
    return {
      valid: true,
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  async getProfile(@Request() req) {
    return {
      id_user: req.user.id_user,
      username: req.user.username,
      email: req.user.email,
      roles: req.user.roles,
    };
  }
}
