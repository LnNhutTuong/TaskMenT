import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PriorityLevel, RoleName } from '../src/generated/prisma/enums.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the seed');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const seedUsers = [
  {
    email: 'admin@taskmanager.local',
    password: 'mengo123',
    name: 'XimenT',
    role: RoleName.ADMIN,
  },
  {
    email: 'user@taskmanager.local',
    password: 'mengo123',
    name: 'Nutthounug',
    role: RoleName.USER,
  },
] as const;

async function main() {
  const users = new Map<string, { id: string }>();

  for (const seedUser of seedUsers) {
    const hashedPassword = await bcrypt.hash(seedUser.password, 10);

    const user = await prisma.user.upsert({
      where: {
        email: seedUser.email,
      },
      update: {
        name: seedUser.name,
        role: seedUser.role,
        password: hashedPassword,
      },
      create: {
        email: seedUser.email,
        name: seedUser.name,
        role: seedUser.role,
        password: hashedPassword,
      },
      select: {
        id: true,
      },
    });

    users.set(seedUser.email, user);
  }

  const admin = users.get('admin@taskmanager.local');
  const user = users.get('user@taskmanager.local');

  if (!admin || !user) {
    throw new Error('Seed users were not created');
  }

  // Clear project-related data.
  await prisma.assignedTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskStatus.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();

  const projectSeeds = [
    {
      name: 'Task Manager Platform',
      description: 'Build and improve the core task management experience.',
      ownerId: admin.id,

      // Owner is NOT a project member.
      memberIds: [user.id],

      tasks: [
        {
          title: 'Review project requirements',
          description: 'Review the requirements and plan the next steps.',
          status: 'IN_PROGRESS',
          priority: PriorityLevel.HIGH,

          // Owner + member can both be assigned.
          assigneeIds: [admin.id, user.id],
        },
        {
          title: 'Implement authentication flow',
          description: 'Implement register and login with JWT authentication.',
          status: 'TODO',
          priority: PriorityLevel.HIGH,
          assigneeIds: [user.id],
        },
        {
          title: 'Set up project board',
          description: 'Create the first project board and default statuses.',
          status: 'DONE',
          priority: PriorityLevel.MEDIUM,
          assigneeIds: [admin.id],
        },
      ],
    },

    {
      name: 'Engineering Operations',
      description:
        'Keep engineering quality, delivery, and documentation on track.',
      ownerId: user.id,

      // Owner is NOT a project member.
      memberIds: [admin.id],

      tasks: [
        {
          title: 'Write API tests',
          description: 'Add unit tests for the main controllers and services.',
          status: 'TODO',
          priority: PriorityLevel.MEDIUM,
          assigneeIds: [user.id, admin.id],
        },
        {
          title: 'Improve task filtering',
          description:
            'Make status, priority, and keyword filters easier to use.',
          status: 'IN_PROGRESS',
          priority: PriorityLevel.MEDIUM,
          assigneeIds: [user.id],
        },
        {
          title: 'Document API authentication',
          description:
            'Document JWT authentication and the protected endpoints.',
          status: 'DONE',
          priority: PriorityLevel.LOW,
          assigneeIds: [admin.id, user.id],
        },
      ],
    },
  ] as const;

  const statuses = [
    {
      key: 'TODO',
      name: 'To do',
      isDefault: true,
    },
    {
      key: 'IN_PROGRESS',
      name: 'In progress',
      isDefault: true,
    },
    {
      key: 'DONE',
      name: 'Done',
      isDefault: true,
    },
  ] as const;

  for (const projectSeed of projectSeeds) {
    // 1. Create project + members.
    const project = await prisma.project.create({
      data: {
        name: projectSeed.name,
        description: projectSeed.description,
        ownerId: projectSeed.ownerId,

        members: {
          create: projectSeed.memberIds.map((memberId) => ({
            memberId,
          })),
        },
      },
    });

    // 2. Create default statuses for this project.
    await prisma.taskStatus.createMany({
      data: statuses.map((status) => ({
        ...status,
        projectId: project.id,
      })),
    });

    // 3. Get status IDs belonging to this project.
    const projectStatuses = await prisma.taskStatus.findMany({
      where: {
        projectId: project.id,
      },
      select: {
        id: true,
        key: true,
      },
    });

    const statusIds = new Map(
      projectStatuses.map((status) => [status.key, status.id]),
    );

    // 4. Create tasks + assignees.
    for (const taskSeed of projectSeed.tasks) {
      const statusId = statusIds.get(taskSeed.status);

      if (!statusId) {
        throw new Error(
          `Missing status ${taskSeed.status} for ${project.name}`,
        );
      }

      await prisma.task.create({
        data: {
          title: taskSeed.title,
          description: taskSeed.description,
          priority: taskSeed.priority,
          projectId: project.id,
          statusId,

          assigned: {
            create: taskSeed.assigneeIds.map((userId) => ({
              assignId: userId,
            })),
          },
        },
      });
    }
  }

  console.log('Seed completed successfully');
  console.log('Admin: admin@taskmanager.local / mengo123');
  console.log('User: user@taskmanager.local / mengo123');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
