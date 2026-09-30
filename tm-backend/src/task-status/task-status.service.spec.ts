import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoleName } from '../generated/prisma/enums.js';
import { TaskStatusService } from './task-status.service.js';

describe('TaskStatusService', () => {
  let service: TaskStatusService;
  const prisma = {
    project: {
      findUnique: vi.fn(),
    },
    taskStatus: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      count: vi.fn(),
    },
  };

  const owner = {
    id: 'owner-id',
    email: 'owner@example.com',
    name: 'Owner',
    role: RoleName.USER,
  };

  const project = {
    id: 'project-id',
    ownerId: owner.id,
    members: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskStatusService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TaskStatusService>(TaskStatusService);
    prisma.project.findUnique.mockResolvedValue(project);
  });

  it('normalizes a status key and defaults the name to that key', async () => {
    prisma.taskStatus.findFirst.mockResolvedValue(null);
    prisma.taskStatus.create.mockResolvedValue({ id: 'status-id' });

    await service.createStatus('project-id', owner, '  REVIEW  ');

    expect(prisma.taskStatus.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-id',
        key: 'REVIEW',
        name: 'REVIEW',
        isDefault: false,
      },
    });
  });

  it('rejects duplicate status keys within a project', async () => {
    prisma.taskStatus.findFirst.mockResolvedValue({ id: 'existing-status' });

    await expect(
      service.createStatus('project-id', owner, 'TODO'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.taskStatus.create).not.toHaveBeenCalled();
  });

  it('prevents deleting default statuses', async () => {
    prisma.taskStatus.findUnique.mockResolvedValue({
      id: 'status-id',
      projectId: 'project-id',
      isDefault: true,
    });

    await expect(
      service.deleteStatus('project-id', 'status-id', owner),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.taskStatus.delete).not.toHaveBeenCalled();
  });

  it('prevents deleting statuses still assigned to tasks', async () => {
    prisma.taskStatus.findUnique.mockResolvedValue({
      id: 'status-id',
      projectId: 'project-id',
      isDefault: false,
    });
    prisma.task.count.mockResolvedValue(1);

    await expect(
      service.deleteStatus('project-id', 'status-id', owner),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.taskStatus.delete).not.toHaveBeenCalled();
  });
});
