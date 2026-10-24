import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CleanupService } from './cleanup.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

describe('CleanupService', () => {
  let service: CleanupService;
  let prisma: {
    objective: { deleteMany: ReturnType<typeof vi.fn> };
    task: { deleteMany: ReturnType<typeof vi.fn> };
    project: { deleteMany: ReturnType<typeof vi.fn> };
    workspace: { deleteMany: ReturnType<typeof vi.fn> };
    user: { findMany: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
    evidence: { findMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      objective: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      task: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
      project: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      workspace: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue({ id: 'user-1' }),
      },
      evidence: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupDeletedData - Step filtering & rules', () => {
    it('should delete objectives while protecting keyResults linked to tasks', async () => {
      await service.cleanupDeletedData();

      expect(prisma.objective.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: { lte: expect.any(Date) },
          keyResults: {
            none: {
              taskLinks: {
                some: {},
              },
            },
          },
        }),
      });
    });

    it('should delete tasks while protecting tasks with subTasks or ACCEPTED evidence', async () => {
      await service.cleanupDeletedData();

      expect(prisma.task.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: { lte: expect.any(Date) },
          subTasks: {
            none: {},
          },
          taskOutputs: {
            every: {
              evidences: {
                none: {
                  status: 'ACCEPTED',
                },
              },
            },
          },
        }),
      });
    });

    it('should delete projects only when they have no remaining tasks or objectives', async () => {
      await service.cleanupDeletedData();

      expect(prisma.project.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: { lte: expect.any(Date) },
          tasks: {
            none: {},
          },
          objectives: {
            none: {},
          },
        }),
      });
    });

    it('should delete workspaces only when having no projects, objectives, or SUBMITTED/REVIEWING/COMPLETED evaluations', async () => {
      await service.cleanupDeletedData();

      expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: { lte: expect.any(Date) },
          projects: {
            none: {},
          },
          objectives: {
            none: {},
          },
          evaluationPeriods: {
            none: {
              evaluations: {
                some: {
                  status: { in: ['SUBMITTED', 'REVIEWING', 'COMPLETED'] },
                },
              },
            },
          },
        }),
      });
    });

    it('should continue executing other cleanup steps even if one step fails', async () => {
      prisma.objective.deleteMany.mockRejectedValueOnce(new Error('DB connection error on objectives'));

      await expect(service.cleanupDeletedData()).resolves.not.toThrow();

      // Các bước tiếp theo vẫn phải được gọi
      expect(prisma.task.deleteMany).toHaveBeenCalled();
      expect(prisma.project.deleteMany).toHaveBeenCalled();
      expect(prisma.workspace.deleteMany).toHaveBeenCalled();
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('cleanupUsers - User protection and error handling', () => {
    it('should filter users with comprehensive protection rules', async () => {
      await service.cleanupDeletedData();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: { lte: expect.any(Date) },
          ownedWorkspaces: { none: {} },
          createdProjects: { none: {} },
          createdTasks: { none: {} },
          reviewedEvidence: { none: { status: 'ACCEPTED' } },
          reviewerEvaluation: {
            none: {
              status: { in: ['SUBMITTED', 'REVIEWING', 'COMPLETED'] },
            },
          },
          submittedEvidence: { none: { status: 'ACCEPTED' } },
          userEvaluation: {
            none: {
              status: {
                in: ['SUBMITTED', 'REVIEWING', 'COMPLETED'],
              },
            },
          },
        }),
        select: { id: true },
      });
    });

    it('should successfully delete eligible users', async () => {
      prisma.user.findMany.mockResolvedValueOnce([{ id: 'user-1' }, { id: 'user-2' }]);

      await service.cleanupDeletedData();

      expect(prisma.user.delete).toHaveBeenCalledTimes(2);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-2' } });
    });

    it('should handle P2003 foreign key constraint by skipping user and continuing with next user', async () => {
      prisma.user.findMany.mockResolvedValueOnce([{ id: 'user-foreign-key' }, { id: 'user-safe' }]);

      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed on the field: `userId`',
        {
          code: 'P2003',
          clientVersion: '7.x',
        },
      );

      prisma.user.delete
        .mockRejectedValueOnce(p2003Error)
        .mockResolvedValueOnce({ id: 'user-safe' });

      await service.cleanupDeletedData();

      expect(prisma.user.delete).toHaveBeenCalledTimes(2);
      expect(prisma.user.delete).toHaveBeenNthCalledWith(1, { where: { id: 'user-foreign-key' } });
      expect(prisma.user.delete).toHaveBeenNthCalledWith(2, { where: { id: 'user-safe' } });
    });

    it('should handle general error on user deletion without breaking the entire process', async () => {
      prisma.user.findMany.mockResolvedValueOnce([{ id: 'user-err' }, { id: 'user-safe' }]);

      prisma.user.delete
        .mockRejectedValueOnce(new Error('Unexpected disk read error'))
        .mockResolvedValueOnce({ id: 'user-safe' });

      await service.cleanupDeletedData();

      expect(prisma.user.delete).toHaveBeenCalledTimes(2);
      expect(prisma.user.delete).toHaveBeenNthCalledWith(2, { where: { id: 'user-safe' } });
    });
  });
});
