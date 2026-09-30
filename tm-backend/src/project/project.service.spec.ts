import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoleName } from '../generated/prisma/enums.js';
import { ProjectService } from './project.service.js';

describe('ProjectService', () => {
  let service: ProjectService;
  const prisma = {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectMember: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    taskStatus: {
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  };

  const owner = {
    id: 'owner-id',
    email: 'owner@example.com',
    name: 'Owner',
    role: RoleName.USER,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('creates a project with unique members and default task statuses', async () => {
    const project = {
      id: 'project-id',
      ownerId: owner.id,
      members: [{ memberId: 'member-id' }],
    };
    prisma.user.findMany.mockResolvedValue([{ id: 'member-id' }]);
    prisma.project.create.mockResolvedValue(project);
    prisma.project.findUnique.mockResolvedValue(project);

    await service.createProject(
      {
        name: '  Project name  ',
        description: '  Description  ',
        memberIds: ['member-id', 'member-id', owner.id],
      },
      owner,
    );

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Project name',
        description: 'Description',
        ownerId: owner.id,
        members: { create: [{ memberId: 'member-id' }] },
      },
    });
    expect(prisma.taskStatus.createMany).toHaveBeenCalledWith({
      data: [
        { projectId: project.id, key: 'TODO', name: 'To do', isDefault: true },
        {
          projectId: project.id,
          key: 'IN_PROGRESS',
          name: 'In progress',
          isDefault: true,
        },
        { projectId: project.id, key: 'DONE', name: 'Done', isDefault: true },
      ],
    });
  });

  it('rejects project members that do not exist', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await expect(
      service.createProject(
        { name: 'Project', memberIds: ['missing-user'] },
        owner,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.project.create).not.toHaveBeenCalled();
  });

  it('rejects access to a project for users who are not members', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-id',
      ownerId: owner.id,
      members: [],
    });

    await expect(
      service.findOne('project-id', {
        ...owner,
        id: 'outsider-id',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
