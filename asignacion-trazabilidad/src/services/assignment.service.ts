import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Assignment } from '../entities/assignment.entity';
import { AssignmentRepository } from '../repositories/assignment.repository';
import { CreateAssignmentDto } from '../dtos/create-assignment.dto';
import { AuditService } from './audit.service';

/**
 * Service: Assignment
 * Lógica de negocio para asignación de vehículos a propietarios
 *
 * Responsabilidades:
 * - Validar asignaciones (claves compuestas)
 * - Crear nuevas asignaciones
 * - Revocar asignaciones existentes
 * - Consultar flota de usuario
 * - Integración con servicio de auditoría
 */
@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    private assignmentRepository: AssignmentRepository,
    private auditService: AuditService,
  ) {}

  /**
   * RF1: Crear asignación de vehículo a propietario
   *
   * Validaciones:
   * - Usuario y vehículo deben ser UUIDs válidos
   * - No puede existir una asignación activa del mismo vehículo a otro usuario
   * - Se registra en auditoría automáticamente
   *
   * @param createAssignmentDto Datos de la asignación
   * @param performedByUserId Usuario que realiza la acción (para auditoría)
   * @returns Asignación creada
   */
  async assignVehicleToUser(
    createAssignmentDto: CreateAssignmentDto,
    performedByUserId: string,
  ): Promise<Assignment> {
    const { userId, vehicleId, notes } = createAssignmentDto;

    this.logger.debug(
      `Asignando vehículo ${vehicleId} a usuario ${userId}`,
    );

    // Validación: Verificar si ya existe una asignación activa del vehículo
    const existingAssignment = await this.assignmentRepository.findOne({
      where: { vehicleId, isActive: true },
    });

    if (existingAssignment && existingAssignment.userId !== userId) {
      this.logger.warn(
        `Intento de asignar vehículo ${vehicleId} que ya está asignado a ${existingAssignment.userId}`,
      );
      throw new ConflictException(
        `El vehículo ${vehicleId} ya está asignado a otro usuario. Revoque la asignación anterior primero.`,
      );
    }

    // Validación: Verificar si ya existe una asignación del mismo usuario-vehículo
    const duplicateAssignment = await this.assignmentRepository.findByCompositeKey(
      userId,
      vehicleId,
    );

    if (duplicateAssignment && duplicateAssignment.isActive) {
      this.logger.warn(
        `Intento de crear asignación duplicada: ${userId} - ${vehicleId}`,
      );
      throw new ConflictException(
        `El vehículo ya está asignado a este usuario.`,
      );
    }

    // Crear la asignación
    const assignment = this.assignmentRepository.create({
      userId,
      vehicleId,
      isActive: true,
      assignedByUserId: performedByUserId,
      notes,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Registrar en auditoría
    await this.auditService.logAssignmentCreated(
      userId,
      vehicleId,
      performedByUserId,
      { notes },
    );

    this.logger.log(
      `Vehículo ${vehicleId} asignado exitosamente a usuario ${userId}`,
    );

    return savedAssignment;
  }

  /**
   * Revocar asignación de vehículo
   *
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @param performedByUserId Usuario que revoca
   * @returns Asignación revocada
   */
  async revokeAssignment(
    userId: string,
    vehicleId: string,
    performedByUserId: string,
  ): Promise<Assignment> {
    this.logger.debug(
      `Revocando asignación: usuario ${userId}, vehículo ${vehicleId}`,
    );

    const assignment = await this.assignmentRepository.findByCompositeKey(
      userId,
      vehicleId,
    );

    if (!assignment) {
      throw new NotFoundException(
        `No existe asignación para usuario ${userId} y vehículo ${vehicleId}`,
      );
    }

    if (!assignment.isActive) {
      throw new BadRequestException(
        `La asignación ya ha sido revocada previamente.`,
      );
    }

    // Desactivar la asignación
    const previousState = { ...assignment };
    assignment.isActive = false;
    const revokedAssignment = await this.assignmentRepository.save(assignment);

    // Registrar en auditoría
    await this.auditService.logAssignmentRevoked(
      userId,
      vehicleId,
      performedByUserId,
      previousState,
      revokedAssignment,
    );

    this.logger.log(
      `Asignación revocada: usuario ${userId}, vehículo ${vehicleId}`,
    );

    return revokedAssignment;
  }

  /**
   * RF3: Obtener flota de un usuario (todos los vehículos asignados)
   *
   * @param userId ID del usuario
   * @param includeInactive Si incluir asignaciones revocadas
   * @returns Array de asignaciones del usuario
   */
  async getUserFleet(
    userId: string,
    includeInactive: boolean = false,
  ): Promise<Assignment[]> {
    this.logger.debug(`Obteniendo flota del usuario ${userId}`);

    return this.assignmentRepository.findByUserId(userId, !includeInactive);
  }

  /**
   * Obtener historial completo de asignaciones de un usuario
   *
   * @param userId ID del usuario
   * @returns Array de asignaciones (activas e inactivas)
   */
  async getUserAssignmentHistory(userId: string): Promise<Assignment[]> {
    return this.assignmentRepository.findByUserId(userId, false);
  }

  /**
   * Contar vehículos activos asignados a un usuario
   *
   * @param userId ID del usuario
   * @returns Número de vehículos
   */
  async countUserActiveVehicles(userId: string): Promise<number> {
    return this.assignmentRepository.countUserAssignments(userId, true);
  }

  /**
   * Verificar si un usuario tiene un vehículo específico
   *
   * @param userId ID del usuario
   * @param vehicleId ID del vehículo
   * @returns true si el usuario tiene el vehículo asignado activamente
   */
  async userHasVehicle(userId: string, vehicleId: string): Promise<boolean> {
    const assignment = await this.assignmentRepository.findByCompositeKey(
      userId,
      vehicleId,
    );

    return !!(assignment && assignment.isActive);
  }

  /**
   * Obtener asignaciones de un vehículo
   * (útil para auditoría: ver quién ha tenido un vehículo)
   *
   * @param vehicleId ID del vehículo
   * @param activeOnly Si solo devolver asignación activa
   * @returns Array de asignaciones
   */
  async getVehicleAssignments(
    vehicleId: string,
    activeOnly: boolean = true,
  ): Promise<Assignment[]> {
    return this.assignmentRepository.findByVehicleId(vehicleId, activeOnly);
  }

  /**
   * Obtener propietario actual de un vehículo
   *
   * @param vehicleId ID del vehículo
   * @returns ID del usuario propietario o null
   */
  async getCurrentOwnerOfVehicle(vehicleId: string): Promise<string | null> {
    return this.assignmentRepository.getCurrentOwnerOfVehicle(vehicleId);
  }

  /**
   * Desactivar todas las asignaciones de un usuario
   * (Usado cuando se desactiva una cuenta)
   *
   * @param userId ID del usuario
   * @param performedByUserId Usuario que realiza la acción
   */
  async deactivateUserVehicles(
    userId: string,
    performedByUserId: string,
  ): Promise<void> {
    this.logger.debug(`Desactivando todos los vehículos del usuario ${userId}`);

    const assignments = await this.getUserFleet(userId, false);

    for (const assignment of assignments) {
      if (assignment.isActive) {
        await this.revokeAssignment(
          userId,
          assignment.vehicleId,
          performedByUserId,
        );
      }
    }

    this.logger.log(`Todos los vehículos del usuario ${userId} han sido revocados`);
  }

  /**
   * Obtener estadísticas de un usuario
   *
   * @param userId ID del usuario
   * @returns Objeto con estadísticas
   */
  async getUserStatistics(userId: string) {
    const activeCount = await this.assignmentRepository.countUserAssignments(
      userId,
      true,
    );
    const totalCount = await this.assignmentRepository.countUserAssignments(
      userId,
      false,
    );

    return {
      userId,
      activeVehicles: activeCount,
      totalAssignments: totalCount,
      revokedAssignments: totalCount - activeCount,
    };
  }

  /**
   * Obtener todas las asignaciones
   *
   * @param activeOnly Si true, solo devuelve asignaciones activas
   * @returns Array de todas las asignaciones
   */
  async getAllAssignments(activeOnly: boolean = true): Promise<Assignment[]> {
    this.logger.debug(`Obteniendo todas las asignaciones (activas: ${activeOnly})`);
    return this.assignmentRepository.findAll(activeOnly);
  }
}
