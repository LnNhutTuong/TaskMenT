import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { RoleScope } from '../src/generated/prisma/enums.js';
import { PERMISSION_KEYS, ROLE_NAME_DEFAULT } from '../src/permission/constants/pemission.constants.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to run the seed');
if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run destructive seed in production');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'mengo123';
const WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';


const ALL_PERMISSION_KEYS = Object.values(PERMISSION_KEYS);
const P = PERMISSION_KEYS;

// Quyen cap he thong: chi Super Admin dung (Super Admin bypass qua isSuperAdmin)
const SYSTEM_ONLY = [P.USER_VIEW, P.USER_CREATE, P.USER_UPDATE, P.USER_DELETE];

// Chi owner workspace moi xoa duoc -> check them ownerId trong service
const OWNER_ONLY = [P.WORKSPACE_DELETE];

const ROLE_DEFINITIONS: { name: string; permissions: string[] }[] = [
  {
    name: ROLE_NAME_DEFAULT.WORKSPACE_MANAGER,
    permissions: ALL_PERMISSION_KEYS.filter(
      (k) => !SYSTEM_ONLY.includes(k) && !OWNER_ONLY.includes(k),
    ),
  },
  {
    name: ROLE_NAME_DEFAULT.PROJECT_LEAD,
    permissions: [
      P.WORKSPACE_VIEW,
      // Project
      P.PROJECT_VIEW, P.PROJECT_UPDATE, P.PROJECT_MANAGE_MEMBERS,
      // Task
      P.TASK_VIEW, P.TASK_CREATE, P.TASK_UPDATE, P.TASK_DELETE, P.TASK_ASSIGN,
      P.TASK_VIEW_KEYRESULT, P.TASK_LINK_KEYRESULT, P.TASK_UNLINK_KEYRESULT,
      // Output / Evidence
      P.OUTPUT_VIEW, P.OUTPUT_CREATE, P.OUTPUT_UPDATE, P.OUTPUT_DELETE,
      P.EVIDENCE_VIEW, P.EVIDENCE_SUBMIT, P.EVIDENCE_REVIEW,
      // OKR
      P.OBJECTIVE_VIEW, P.OBJECTIVE_CREATE, P.OBJECTIVE_UPDATE,
      P.KEY_RESULT_VIEW, P.KEY_RESULT_CREATE, P.KEY_RESULT_UPDATE,
      // KPI
      P.METRIC_VIEW, P.FORMULA_VIEW, P.FORMULA_ASSIGN_TASK,
      P.KPI_VIEW, P.KPI_CALCULATE,
      // Workflow
      P.WORKFLOW_VIEW, P.WORKFLOW_CREATE, P.WORKFLOW_UPDATE,
    ],
  },
  {
    name: ROLE_NAME_DEFAULT.MEMBER,
    permissions: [
      //workspace
      P.WORKSPACE_VIEW,
      //project
      P.PROJECT_VIEW,
      //task
      P.TASK_VIEW, P.TASK_UPDATE, P.TASK_VIEW_KEYRESULT,
      //output
      P.OUTPUT_VIEW, P.OUTPUT_CREATE, P.OUTPUT_UPDATE,
      //evidence
      P.EVIDENCE_VIEW, P.EVIDENCE_SUBMIT, P.EVIDENCE_UPDATE,
      //objective
      P.OBJECTIVE_VIEW, P.KEY_RESULT_VIEW,
      //kpi
      P.METRIC_VIEW, P.FORMULA_VIEW, P.KPI_VIEW,
      //workflow
      P.WORKFLOW_VIEW,
    ],
  },
  {
    name: ROLE_NAME_DEFAULT.VIEWER,
    permissions: [
      //workspace
      P.WORKSPACE_VIEW,
      //project
      P.PROJECT_VIEW,
      //task
      P.TASK_VIEW, P.TASK_VIEW_KEYRESULT,
      //output
      P.OUTPUT_VIEW,
      //evidence
      P.EVIDENCE_VIEW,
      //objective
      P.OBJECTIVE_VIEW, P.KEY_RESULT_VIEW,
      //kpi
      P.METRIC_VIEW, P.FORMULA_VIEW, P.KPI_VIEW,
      //workflow
      P.WORKFLOW_VIEW,
    ],
  },
];

// Mỗi user test ứng với 1 role de test RBAC
const TEST_USERS = [
  { email: 'manager@taskmanager.local', name: 'Tran Manager', role: 'Workspace Manager' },
  { email: 'lead@taskmanager.local', name: 'Le Project Lead', role: 'Project Lead' },
  { email: 'user@taskmanager.local', name: 'Nguyen Van Test', role: 'Member' },
  { email: 'viewer@taskmanager.local', name: 'Pham Viewer', role: 'Viewer' },
];

/** Xoa sach du lieu tat ca bang (tru bang migration cua Prisma) */
async function wipeDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
  console.log(`🧹 Wiped ${tables.length} tables`);
}

async function main() {
  console.log('🌱 Starting database seeding...');
  await wipeDatabase();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // 1. Permissions
  await prisma.permission.createMany({
    data: ALL_PERMISSION_KEYS.map((key) => ({ key })),
  });
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map((p) => [p.key, p.id]));

  // 2. Super admin (system role)
  const superAdminRole = await prisma.role.create({
    data: { name: 'SUPER_ADMIN', scope: RoleScope.SYSTEM, isSystem: true },
  });
  const superAdmin = await prisma.user.create({
    data: { email: 'admin@taskmanager.local', password: passwordHash, name: 'Super Administrator' },
  });
  await prisma.userRole.create({
    data: { userId: superAdmin.id, roleId: superAdminRole.id },
  });

  // 3. Workspace
  const workspace = await prisma.workspace.create({
    data: { id: WORKSPACE_ID, name: 'Main Workspace', ownerId: superAdmin.id },
  });

  // 4. Workspace roles + permissions
  const roleIdByName = new Map<string, string>();
  for (const def of ROLE_DEFINITIONS) {
    const role = await prisma.role.create({
      data: { workspaceId: workspace.id, name: def.name, scope: RoleScope.WORKSPACE },
    });
    roleIdByName.set(def.name, role.id);

    await prisma.workspaceRole.create({
      data: { workspaceId: workspace.id, roleId: role.id },
    });

    const rows = def.permissions
      .map((key) => permissionMap.get(key))
      .filter((id): id is string => !!id)
      .map((permissionId) => ({ roleId: role.id, permissionId }));
    await prisma.rolePermission.createMany({ data: rows });
  }

  // 5. Users test + gan vao workspace
  const userByRole = new Map<string, { id: string }>();
  for (const u of TEST_USERS) {
    const user = await prisma.user.create({
      data: { email: u.email, password: passwordHash, name: u.name },
    });
    userByRole.set(u.role, user);
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        roleId: roleIdByName.get(u.role)!,
      },
    });
  }

  // Super admin cung la member (Manager) cua workspace
  await prisma.workspaceMember.create({
    data: {
      userId: superAdmin.id,
      workspaceId: workspace.id,
      roleId: roleIdByName.get('Workspace Manager')!,
    },
  });

const lead = userByRole.get('Project Lead')!;
  const member = userByRole.get('Member')!;
  const manager = userByRole.get('Workspace Manager')!;

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      createdById: manager.id,
      name: 'Website Redesign',
      description: 'Du an mau de test RBAC',
    },
  });

  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Thiet ke wireframe',
      description: 'Do Lead tao, giao cho Member',
      createdById: lead.id,
      taskAssignees: { create: { userId: member.id } },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Code trang chu',
      description: 'Giao cho Member',
      createdById: lead.id,
      taskAssignees: { create: { userId: member.id } },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Review noi dung',
      description: 'Giao cho Lead',
      createdById: manager.id,
      taskAssignees: { create: { userId: lead.id } },
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Task chua giao',
      description: 'Chua co assignee',
      createdById: manager.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log(`👑 admin@taskmanager.local   (SUPER_ADMIN + Manager) / ${SEED_PASSWORD}`);
  for (const u of TEST_USERS) {
    console.log(`👤 ${u.email.padEnd(28)} (${u.role}) / ${SEED_PASSWORD}`);
  }
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