import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { RoleScope } from '../src/generated/prisma/enums.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the seed');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Tạo System Role: SUPER_ADMIN
  let superAdminRole = await prisma.role.findFirst({
    where: {
      name: 'SUPER_ADMIN',
      scope: RoleScope.SYSTEM,
    },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        scope: RoleScope.SYSTEM,
        isSystem: true,
      },
    });
  }

  // 2. Tạo tài khoản Super Admin
  const adminPassword = await bcrypt.hash('mengo123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@taskmanager.local' },
    update: {
      password: adminPassword,
      name: 'Super Administrator',
    },
    create: {
      email: 'admin@taskmanager.local',
      password: adminPassword,
      name: 'Super Administrator',
    },
  });

  // Gán role SUPER_ADMIN cho user này
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  // 3. Tạo tài khoản Regular User (để test add member / assign task)
  const userPassword = await bcrypt.hash('mengo123', 10);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@taskmanager.local' },
    update: {
      password: userPassword,
      name: 'Nguyen Van Test',
    },
    create: {
      email: 'user@taskmanager.local',
      password: userPassword,
      name: 'Nguyen Van Test',
    },
  });

  // 4. Tạo một Workspace mẫu (Vì Project bắt buộc thuộc về 1 Workspace)
  const workspace = await prisma.workspace.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Main Workspace',
    },
  });

  // Role cấp Workspace
  let workspaceMemberRole = await prisma.role.findFirst({
    where: {
      workspaceId: workspace.id,
      name: 'WORKSPACE_MEMBER',
    },
  });

  if (!workspaceMemberRole) {
    workspaceMemberRole = await prisma.role.create({
      data: {
        workspaceId: workspace.id,
        name: 'WORKSPACE_MEMBER',
        scope: RoleScope.WORKSPACE,
      },
    });
  }

  // Add cả 2 user vào Workspace
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: superAdmin.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      workspaceId: workspace.id,
      roleId: workspaceMemberRole.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: regularUser.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      workspaceId: workspace.id,
      roleId: workspaceMemberRole.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('👑 Super Admin: admin@taskmanager.local / mengo123');
  console.log('👤 Member User: user@taskmanager.local  / mengo123');
  console.log(`🏢 Workspace ID: ${workspace.id}`);
  console.log('--------------------------------------------------');
}

try {
  await main();
} catch (e) {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
