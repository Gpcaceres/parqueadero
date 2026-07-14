import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { AuditService } from '../services/audit.service';
import { VehicleIntegrationService } from '../services/vehicle-integration.service';
import { UserIntegrationService } from '../services/user-integration.service';
import { ZoneIntegrationService } from '../services/zone-integration.service';
import { CreateAssignmentDto } from '../dtos/create-assignment.dto';
import { AuditTrailFilterDto } from '../dtos/audit-trail.dto';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const WRITE_ROLES = ['admin', 'root', 'recaudador'];

// UUID nil usado para representar al "sistema" como actor de auditoría en
// las lecturas de auditoría (que no mutan nada y no requieren autenticar).
// Los endpoints que sí mutan (crear/revocar asignación) exigen JwtAuthGuard,
// así que ahí siempre hay un usuario real. performedByUserId es una columna
// uuid NOT NULL en AuditTrail, así que no puede ser el literal "system".
const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

// La IP puede llegar como IPv4 mapeada a IPv6 (::ffff:172.18.0.5) cuando
// Node corre en Docker; se normaliza a IPv4 puro para pasar la validación
// de ms-audit (@IsIP('4')).
function normalizarIp(ip?: string): string | undefined {
  return ip?.replace(/^::ffff:/, '');
}

/**
 * Controller: Assignment
 * Endpoints para gestión de asignaciones y trazabilidad
 *
 * Implementa:
 * - RF1: Asignación de vehículos a propietarios
 * - RF2: Registro de trazabilidad/auditoría
 * - RF3: Consulta de flota por propietario
 */
@Controller('asignaciones')
@UseGuards(OptionalAuthGuard)
export class AssignmentController {
  private readonly logger = new Logger(AssignmentController.name);

  constructor(
    private assignmentService: AssignmentService,
    private auditService: AuditService,
    private vehicleIntegrationService: VehicleIntegrationService,
    private userIntegrationService: UserIntegrationService,
    private zoneIntegrationService: ZoneIntegrationService,
  ) {}

  /**
   * RF1: POST /api/asignaciones
   * Crear asignación de vehículo a propietario
   *
   * Request:
   * {
   *   "userId": "uuid",
   *   "vehicleId": "uuid",
   *   "notes": "Vehículo principal" (opcional)
   * }
   *
   * Response:
   * {
   *   "userId": "uuid",
   *   "vehicleId": "uuid",
   *   "isActive": true,
   *   "createdAt": "2024-06-24T14:30:45Z",
   *   "updatedAt": "2024-06-24T14:30:45Z"
   * }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...WRITE_ROLES)
  async createAssignment(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req: Request,
  ) {
    this.logger.log(
      `Creando asignación: usuario ${createAssignmentDto.userId}, vehículo ${createAssignmentDto.vehicleId}`,
    );

    // Validar que el usuario existe
    const userExists = await this.userIntegrationService.userExists(
      createAssignmentDto.userId,
    );

    if (!userExists) {
      throw new BadRequestException(
        `Usuario ${createAssignmentDto.userId} no existe en el microservicio de personas`,
      );
    }

    // Validar que el usuario está activo
    const userActive = await this.userIntegrationService.isUserActive(
      createAssignmentDto.userId,
    );

    if (!userActive) {
      throw new BadRequestException(
        `Usuario ${createAssignmentDto.userId} no está activo`,
      );
    }

    // Validar que el vehículo existe
    const vehicleExists = await this.vehicleIntegrationService.vehicleExists(
      createAssignmentDto.vehicleId,
    );

    if (!vehicleExists) {
      throw new BadRequestException(
        `Vehículo ${createAssignmentDto.vehicleId} no existe en el microservicio de vehículos`,
      );
    }

    // Si viene un JWT válido, se usa el usuario autenticado como actor de
    // auditoría; si no, se cae al actor "sistema" (compatibilidad hacia atrás).
    const performedByUserId = (req as any).user?.id_user ?? SYSTEM_ACTOR_ID;

    const assignment = await this.assignmentService.assignVehicleToUser(
      createAssignmentDto,
      performedByUserId,
      normalizarIp(req.ip),
      (req as any).user?.username,
      (req as any).user?.roles?.[0],
    );

    // Enriquecer respuesta con detalles de usuario y vehículo
    return this.vehicleIntegrationService.enrichAssignmentWithVehicle(
      assignment,
    );
  }

  /**
   * GET /api/asignaciones
   * Obtener todas las asignaciones
   *
   * Query parameters:
   * - activeOnly: boolean (opcional, default: true)
   *
   * Response: Array de todas las asignaciones
   */
  @Get()
  async getAllAssignments(
    @Query('activeOnly') activeOnly: string = 'true',
  ) {
    this.logger.log(`Obteniendo todas las asignaciones (activas: ${activeOnly})`);
    return this.assignmentService.getAllAssignments(activeOnly === 'true');
  }

  /**
   * RF3: GET /api/asignaciones/usuario/:userId
   * Obtener flota de un usuario con detalles de vehículos y usuario
   *
   * Parámetros:
   * - userId: ID del usuario
   * - includeInactive: boolean (opcional, default: false)
   * - enriched: boolean (opcional, incluir detalles de usuario y vehículo)
   *
   * Response: Array de asignaciones con detalles enriquecidos
   */
  @Get('usuario/:userId')
  async getUserFleet(
    @Param('userId') userId: string,
    @Query('includeInactive') includeInactive: string = 'false',
    @Query('enriched') enriched: string = 'true',
  ) {
    this.logger.log(
      `Obteniendo flota del usuario ${userId} (enriquecida: ${enriched})`,
    );

    // Validar que el usuario existe
    const userExists = await this.userIntegrationService.userExists(userId);
    if (!userExists) {
      throw new BadRequestException(`Usuario ${userId} no existe`);
    }

    const assignments = await this.assignmentService.getUserFleet(
      userId,
      includeInactive === 'true',
    );

    if (enriched === 'false') {
      return assignments;
    }

    // RF3: Enriquecer con detalles del vehículo
    const assignmentsWithVehicles =
      await this.vehicleIntegrationService.enrichAssignmentsWithVehicles(
        assignments,
      );

    // Enriquecer con detalles del usuario
    return this.userIntegrationService.enrichAssignmentsWithUsers(
      assignmentsWithVehicles,
    );
  }

  /**
   * GET /api/asignaciones/usuario/:userId/estadisticas
   * Obtener estadísticas de un usuario
   */
  @Get('usuario/:userId/estadisticas')
  async getUserStatistics(@Param('userId') userId: string) {
    this.logger.log(`Obteniendo estadísticas del usuario ${userId}`);
    return this.assignmentService.getUserStatistics(userId);
  }

  /**
   * DELETE /api/asignaciones/:userId/:vehicleId
   * Revocar asignación de vehículo
   *
   * Parámetros:
   * - userId: ID del usuario
   * - vehicleId: ID del vehículo
   *
   * Response: Asignación revocada
   */
  @Delete(':userId/:vehicleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...WRITE_ROLES)
  async revokeAssignment(
    @Param('userId') userId: string,
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request,
  ) {
    this.logger.log(
      `Revocando asignación: usuario ${userId}, vehículo ${vehicleId}`,
    );

    const performedByUserId = (req as any).user?.id_user ?? SYSTEM_ACTOR_ID;

    return this.assignmentService.revokeAssignment(
      userId,
      vehicleId,
      performedByUserId,
      normalizarIp(req.ip),
      (req as any).user?.username,
      (req as any).user?.roles?.[0],
    );
  }

  /**
   * RF2: GET /api/asignaciones/trazabilidad/:userId/:vehicleId
   * Obtener historial completo de una asignación
   *
   * Parámetros:
   * - userId: ID del usuario
   * - vehicleId: ID del vehículo
   *
   * Response: Array de eventos cronológicos
   */
  @Get('trazabilidad/:userId/:vehicleId')
  async getAssignmentHistory(
    @Param('userId') userId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    this.logger.log(
      `Obteniendo historial de asignación: usuario ${userId}, vehículo ${vehicleId}`,
    );

    return this.auditService.getAssignmentHistory(userId, vehicleId);
  }

  /**
   * RF2: GET /api/asignaciones/auditoría/usuario/:userId
   * Obtener auditoría completa de un usuario
   */
  @Get('auditoria/usuario/:userId')
  async getUserAuditTrail(@Param('userId') userId: string) {
    this.logger.log(`Obteniendo auditoría del usuario ${userId}`);
    return this.auditService.getUserAuditTrail(userId);
  }

  /**
   * RF2: GET /api/asignaciones/auditoría/vehículo/:vehicleId
   * Obtener auditoría completa de un vehículo
   */
  @Get('auditoria/vehiculo/:vehicleId')
  async getVehicleAuditTrail(@Param('vehicleId') vehicleId: string) {
    this.logger.log(`Obteniendo auditoría del vehículo ${vehicleId}`);
    return this.auditService.getVehicleAuditTrail(vehicleId);
  }

  /**
   * RF2: GET /api/asignaciones/auditoría/buscar
   * Consulta avanzada de auditoría con filtros
   *
   * Query parameters:
   * - userId: filtrar por usuario
   * - vehicleId: filtrar por vehículo
   * - actionType: CREACIÓN, MODIFICACIÓN, ELIMINACIÓN
   * - fromDate: fecha desde (ISO string)
   * - toDate: fecha hasta (ISO string)
   * - page: número de página
   * - limit: registros por página
   */
  @Get('auditoria/buscar')
  async queryAuditTrail(@Query() filters: AuditTrailFilterDto) {
    this.logger.log(`Buscando en auditoría con filtros`, filters);
    return this.auditService.queryAuditTrail(filters);
  }

  /**
   * GET /api/asignaciones/auditoría/eventos-recientes
   * Obtener últimos eventos de auditoría
   */
  @Get('auditoria/eventos-recientes')
  async getRecentEvents(
    @Query('limit') limit: string = '50',
  ) {
    return this.auditService.getLatestEvents(parseInt(limit, 10));
  }

  /**
   * GET /api/asignaciones/auditoría/resumen
   * Obtener resumen de actividad
   */
  @Get('auditoria/resumen')
  async getActivitySummary(
    @Query('userId') userId?: string,
  ) {
    return this.auditService.getActivitySummary(userId);
  }

  /**
   * GET /api/asignaciones/auditoría/usuarios-activos
   * Obtener usuarios más activos
   */
  @Get('auditoria/usuarios-activos')
  async getTopActiveUsers(
    @Query('limit') limit: string = '10',
  ) {
    return this.auditService.getTopActiveUsers(parseInt(limit, 10));
  }

  /**
   * GET /api/asignaciones/vehículo/:vehicleId/propietario
   * Obtener propietario actual de un vehículo
   */
  @Get('vehiculo/:vehicleId/propietario')
  async getCurrentOwner(
    @Param('vehicleId') vehicleId: string,
  ) {
    const userId = await this.assignmentService.getCurrentOwnerOfVehicle(vehicleId);

    return {
      vehicleId,
      userId: userId || null,
      isAssigned: !!userId,
    };
  }

  /**
   * GET /api/asignaciones/health
   * Health check del servicio y sus dependencias
   * Verifica estado de todos los microservicios integrados
   */
  @Get('health')
  async healthCheck() {
    const [vehicleHealth, userHealth, zoneHealth] = await Promise.all([
      this.vehicleIntegrationService.checkVehicleServiceHealth(),
      this.userIntegrationService.checkUserServiceHealth(),
      this.zoneIntegrationService.checkZoneServiceHealth(),
    ]);

    const allServicesHealthy =
      vehicleHealth && userHealth && zoneHealth;

    return {
      status: allServicesHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        asignacion: {
          status: 'UP',
          responseTime: '< 10ms',
        },
        vehiculos: {
          status: vehicleHealth ? 'UP' : 'DOWN',
          url: process.env.VEHICLE_SERVICE_URL || 'http://vehiculos:3000',
        },
        personas: {
          status: userHealth ? 'UP' : 'DOWN',
          url: process.env.USER_SERVICE_URL || 'http://personas:3001',
        },
        zonas: {
          status: zoneHealth ? 'UP' : 'DOWN',
          url: process.env.ZONE_SERVICE_URL || 'http://zonas:8080',
        },
      },
      details: {
        totalServices: 4,
        healthyServices: [vehicleHealth, userHealth, zoneHealth].filter(
          (s) => s,
        ).length,
        message: allServicesHealthy
          ? 'Todos los servicios están operacionales'
          : 'Algunos servicios están degradados',
      },
    };
  }
}
