import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentRepository } from '../repositories/assignment.repository';
import { AuditService } from './audit.service';
import { CreateAssignmentDto } from '../dtos/create-assignment.dto';

/**
 * Test Suite: AssignmentService
 * Pruebas unitarias del servicio de asignación
 *
 * Cubre:
 * - RF1: Creación de asignaciones con validación de claves compuestas
 * - Revocación de asignaciones
 * - Consultas de flota
 * - Integración con auditoría
 */
describe('AssignmentService', () => {
  let service: AssignmentService;
  let assignmentRepository: AssignmentRepository;
  let auditService: AuditService;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockVehicleId = '550e8400-e29b-41d4-a716-446655440001';
  const mockPerformedBy = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: AssignmentRepository,
          useValue: {
            findByCompositeKey: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findByUserId: jest.fn(),
            countUserAssignments: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAssignmentCreated: jest.fn(),
            logAssignmentRevoked: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
    assignmentRepository = module.get<AssignmentRepository>(
      AssignmentRepository,
    );
    auditService = module.get<AuditService>(AuditService);
  });

  describe('assignVehicleToUser', () => {
    it('RF1: Debe crear una asignación válida', async () => {
      const createDto: CreateAssignmentDto = {
        userId: mockUserId,
        vehicleId: mockVehicleId,
        notes: 'Vehículo principal',
      };

      const mockAssignment = {
        userId: mockUserId,
        vehicleId: mockVehicleId,
        isActive: true,
        assignedByUserId: mockPerformedBy,
        notes: 'Vehículo principal',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValueOnce(null);
      jest
        .spyOn(assignmentRepository, 'findByCompositeKey')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(assignmentRepository, 'create')
        .mockReturnValueOnce(mockAssignment as any);
      jest
        .spyOn(assignmentRepository, 'save')
        .mockResolvedValueOnce(mockAssignment as any);
      jest.spyOn(auditService, 'logAssignmentCreated').mockResolvedValueOnce(
        {} as any,
      );

      const result = await service.assignVehicleToUser(
        createDto,
        mockPerformedBy,
      );

      expect(result).toEqual(mockAssignment);
      expect(auditService.logAssignmentCreated).toHaveBeenCalled();
    });

    it('RF1: Debe lanzar ConflictException si el vehículo ya está asignado', async () => {
      const createDto: CreateAssignmentDto = {
        userId: mockUserId,
        vehicleId: mockVehicleId,
      };

      const existingAssignment = {
        userId: '550e8400-e29b-41d4-a716-446655440003',
        vehicleId: mockVehicleId,
        isActive: true,
      };

      jest
        .spyOn(assignmentRepository, 'findOne')
        .mockResolvedValueOnce(existingAssignment as any);

      await expect(
        service.assignVehicleToUser(createDto, mockPerformedBy),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('revokeAssignment', () => {
    it('Debe revocar una asignación activa', async () => {
      const mockAssignment = {
        userId: mockUserId,
        vehicleId: mockVehicleId,
        isActive: true,
      };

      jest
        .spyOn(assignmentRepository, 'findByCompositeKey')
        .mockResolvedValueOnce(mockAssignment as any);
      jest
        .spyOn(assignmentRepository, 'save')
        .mockResolvedValueOnce({ ...mockAssignment, isActive: false } as any);
      jest.spyOn(auditService, 'logAssignmentRevoked').mockResolvedValueOnce(
        {} as any,
      );

      const result = await service.revokeAssignment(
        mockUserId,
        mockVehicleId,
        mockPerformedBy,
      );

      expect(result.isActive).toBe(false);
      expect(auditService.logAssignmentRevoked).toHaveBeenCalled();
    });

    it('Debe lanzar NotFoundException si la asignación no existe', async () => {
      jest
        .spyOn(assignmentRepository, 'findByCompositeKey')
        .mockResolvedValueOnce(null);

      await expect(
        service.revokeAssignment(mockUserId, mockVehicleId, mockPerformedBy),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserFleet', () => {
    it('RF3: Debe devolver la flota del usuario', async () => {
      const mockFleet = [
        {
          userId: mockUserId,
          vehicleId: mockVehicleId,
          isActive: true,
        },
      ];

      jest
        .spyOn(assignmentRepository, 'findByUserId')
        .mockResolvedValueOnce(mockFleet as any);

      const result = await service.getUserFleet(mockUserId);

      expect(result).toEqual(mockFleet);
      expect(assignmentRepository.findByUserId).toHaveBeenCalledWith(
        mockUserId,
        true,
      );
    });
  });

  describe('userHasVehicle', () => {
    it('Debe retornar true si el usuario tiene el vehículo', async () => {
      const mockAssignment = {
        userId: mockUserId,
        vehicleId: mockVehicleId,
        isActive: true,
      };

      jest
        .spyOn(assignmentRepository, 'findByCompositeKey')
        .mockResolvedValueOnce(mockAssignment as any);

      const result = await service.userHasVehicle(mockUserId, mockVehicleId);

      expect(result).toBe(true);
    });

    it('Debe retornar false si el usuario no tiene el vehículo', async () => {
      jest
        .spyOn(assignmentRepository, 'findByCompositeKey')
        .mockResolvedValueOnce(null);

      const result = await service.userHasVehicle(mockUserId, mockVehicleId);

      expect(result).toBe(false);
    });
  });

  describe('getUserStatistics', () => {
    it('Debe devolver estadísticas del usuario', async () => {
      jest
        .spyOn(assignmentRepository, 'countUserAssignments')
        .mockResolvedValueOnce(5) // activos
        .mockResolvedValueOnce(7); // totales

      const result = await service.getUserStatistics(mockUserId);

      expect(result).toEqual({
        userId: mockUserId,
        activeVehicles: 5,
        totalAssignments: 7,
        revokedAssignments: 2,
      });
    });
  });
});
