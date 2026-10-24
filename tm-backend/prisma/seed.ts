import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { RoleScope } from '../src/generated/prisma/enums.js';
import { PERMISSION_KEYS, ROLE_KEY_DEFAULT, ROLE_NAME_DEFAULT } from '../src/permission/constants/pemission.constants.js';

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

// Quyen cap he thong: chi Super Admin dung (Super Admin bypass qua isSuperAdmin).
// Role chi do Super Admin tao/sua/xoa nen ROLE_CREATE/UPDATE/DELETE cung nam o day.
const SYSTEM_ONLY = [
  P.USER_VIEW, P.USER_CREATE, P.USER_UPDATE, P.USER_DELETE,
  P.ROLE_CREATE, P.ROLE_UPDATE, P.ROLE_DELETE,
];

// Chi Owner moi lam duoc (Owner la role duy nhat co 2 quyen nay).
// Van phai check ownerId o service nhu lop bao ve thu hai.
const OWNER_ONLY = [P.WORKSPACE_DELETE, P.WORKSPACE_TRANSFER_OWNERSHIP];

// Moi quyen cap workspace (tru quyen cap he thong)
const WORKSPACE_ALL = ALL_PERMISSION_KEYS.filter((k) => !SYSTEM_ONLY.includes(k));

type RoleDefinition = {
  key: string;
  name: string;
  scope: RoleScope;
  permissions: string[];
};

// Role dung chung toan he thong (workspaceId = null), chi Super Admin tao.
// Workspace "bat" role qua bang WorkspaceRole.
const ROLE_DEFINITIONS: RoleDefinition[] = [
  // ─── SYSTEM ───────────────────────────────────────
  {
    key: ROLE_KEY_DEFAULT.SUPER_ADMIN,
    name: ROLE_NAME_DEFAULT.SUPER_ADMIN,
    scope: RoleScope.SYSTEM,
    permissions: [], // bypass qua isSuperAdmin
  },

  // ─── WORKSPACE ────────────────────────────────────
  {
    key: ROLE_KEY_DEFAULT.OWNER,
    name: ROLE_NAME_DEFAULT.OWNER,
    scope: RoleScope.WORKSPACE,
    permissions: WORKSPACE_ALL,
  },
  {
    key: ROLE_KEY_DEFAULT.WORKSPACE_MANAGER,
    name: ROLE_NAME_DEFAULT.WORKSPACE_MANAGER,
    scope: RoleScope.WORKSPACE,
    permissions: WORKSPACE_ALL.filter((k) => !OWNER_ONLY.includes(k)),
  },
  {
    // Moi nguoi trong workspace deu co role nay (ke ca Lead).
    // Cac quyen thao tac chi ap dung tren doi tuong cua chinh minh -> service check them.
    key: ROLE_KEY_DEFAULT.MEMBER,
    name: ROLE_NAME_DEFAULT.MEMBER,
    scope: RoleScope.WORKSPACE,
    permissions: [
      //workspace
      P.WORKSPACE_VIEW,
      //project
      P.PROJECT_VIEW,
      //task (tu tao task cho chinh minh, sua task duoc giao)
      P.TASK_VIEW, P.TASK_CREATE, P.TASK_UPDATE, P.TASK_VIEW_KEYRESULT,
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
      //evaluation period
      P.EVALUATION_PERIOD_VIEW,
      //evaluation
      P.EVALUATION_VIEW,   // xem phieu cua minh va review cua reviewer ve minh (chi xem)
      P.EVALUATION_SUBMIT, // tu danh gia va nop phieu cua minh
      //classification
      P.CLASSIFICATION_VIEW, //view rule classification
    ],
  },

  // ─── PROJECT ──────────────────────────────────────
  {
    // Quyen nay chi co hieu luc trong project ma user la Lead.
    key: ROLE_KEY_DEFAULT.PROJECT_LEAD,
    name: ROLE_NAME_DEFAULT.PROJECT_LEAD,
    scope: RoleScope.PROJECT,
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
      // Evaluation: cham diem thanh vien trong project (chi phieu duoc gan lam reviewer)
      P.EVALUATION_REVIEW,
    ],
  },
  {
    // Danh dau thanh vien project. Khong them quyen nao ngoai role Member cua workspace.
    key: ROLE_KEY_DEFAULT.PROJECT_MEMBER,
    name: ROLE_NAME_DEFAULT.PROJECT_MEMBER,
    scope: RoleScope.PROJECT,
    permissions: [],
  },
];

// Moi user test: 1 role workspace, co the them 1 role trong project
const TEST_USERS: {
  email: string;
  name: string;
  workspaceRoleKey: string;
  projectRoleKey?: string;
}[] = [
  {
    email: 'manager@taskmanager.local',
    name: 'Trần Quản Lý',
    workspaceRoleKey: ROLE_KEY_DEFAULT.WORKSPACE_MANAGER,
  },
  {
    email: 'lead@taskmanager.local',
    name: 'Lê Tổ Trưởng',
    workspaceRoleKey: ROLE_KEY_DEFAULT.MEMBER,
    projectRoleKey: ROLE_KEY_DEFAULT.PROJECT_LEAD,
  },
  {
    email: 'user@taskmanager.local',
    name: 'Nguyễn Nhân Viên',
    workspaceRoleKey: ROLE_KEY_DEFAULT.MEMBER,
    projectRoleKey: ROLE_KEY_DEFAULT.PROJECT_MEMBER,
  },
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

  // 2. Roles dung chung toan he thong (workspaceId = null) + quyen cua tung role
  const roleIdByKey = new Map<string, string>();
  for (const def of ROLE_DEFINITIONS) {
    const role = await prisma.role.create({
      data: {
        key: def.key,
        name: def.name,
        scope: def.scope,
        isSystem: def.scope === RoleScope.SYSTEM,
      },
    });
    roleIdByKey.set(def.key, role.id);

    const rows = def.permissions
      .map((key) => permissionMap.get(key))
      .filter((id): id is string => !!id)
      .map((permissionId) => ({ roleId: role.id, permissionId }));
    if (rows.length > 0) {
      await prisma.rolePermission.createMany({ data: rows });
    }
  }

  // 3. Super admin (system role)
  const superAdmin = await prisma.user.create({
    data: { email: 'admin@taskmanager.local', password: passwordHash, name: 'Super Administrator' },
  });
  await prisma.userRole.create({
    data: { userId: superAdmin.id, roleId: roleIdByKey.get(ROLE_KEY_DEFAULT.SUPER_ADMIN)! },
  });

  // 4. Workspace (owner = super admin)
  const workspace = await prisma.workspace.create({
    data: { id: WORKSPACE_ID, name: 'Main Workspace', ownerId: superAdmin.id },
  });

  // 5. Workspace bat cac role cap WORKSPACE va PROJECT
  await prisma.workspaceRole.createMany({
    data: ROLE_DEFINITIONS.filter((d) => d.scope !== RoleScope.SYSTEM).map((d) => ({
      workspaceId: workspace.id,
      roleId: roleIdByKey.get(d.key)!,
    })),
  });

  // Owner: ownerId tren Workspace + role OWNER trong WorkspaceMember
  await prisma.workspaceMember.create({
    data: {
      userId: superAdmin.id,
      workspaceId: workspace.id,
      roleId: roleIdByKey.get(ROLE_KEY_DEFAULT.OWNER)!,
    },
  });

  // 6. Users test + gan vao workspace
  const userByEmail = new Map<string, { id: string }>();
  for (const u of TEST_USERS) {
    const user = await prisma.user.create({
      data: { email: u.email, password: passwordHash, name: u.name },
    });
    userByEmail.set(u.email, user);
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        roleId: roleIdByKey.get(u.workspaceRoleKey)!,
      },
    });
  }

  const manager = userByEmail.get('manager@taskmanager.local')!;
  const lead = userByEmail.get('lead@taskmanager.local')!;
  const member = userByEmail.get('user@taskmanager.local')!;

  // 7. Project mau + thanh vien project (role cap PROJECT)
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      createdById: manager.id,
      name: 'Website Redesign',
      description: 'Du an mau de test RBAC',
    },
  });

  for (const u of TEST_USERS) {
    if (!u.projectRoleKey) continue;
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: userByEmail.get(u.email)!.id,
        roleId: roleIdByKey.get(u.projectRoleKey)!,
      },
    });
  }

  // 8. Tasks mau
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      title: 'Thiet ke wireframe',
      description: 'Do Lead tao, giao cho Member',
      createdById: lead.id,
      taskAssignees: { create: { userId: member.id } },
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      title: 'Code trang chu',
      description: 'Giao cho Member',
      createdById: lead.id,
      taskAssignees: { create: { userId: member.id } },
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      title: 'Review noi dung',
      description: 'Giao cho Lead',
      createdById: manager.id,
      taskAssignees: { create: { userId: lead.id } },
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      title: 'Task chua giao',
      description: 'Chua co assignee',
      createdById: manager.id,
    },
  });

  // Task ngoai project (task ca nhan): projectId = null
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: 'Viec ca nhan (ngoai project)',
      description: 'Member tu tao cho chinh minh',
      createdById: member.id,
      taskAssignees: { create: { userId: member.id } },
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log(`👑 admin@taskmanager.local   (SUPER_ADMIN + OWNER) / ${SEED_PASSWORD}`);
  for (const u of TEST_USERS) {
    const projectRole = u.projectRoleKey ? ` + ${u.projectRoleKey}` : '';
    console.log(`👤 ${u.email.padEnd(28)} (${u.workspaceRoleKey}${projectRole}) / ${SEED_PASSWORD}`);
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