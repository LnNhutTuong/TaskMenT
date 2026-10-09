import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { WorkspaceQueryDto } from './dto/workspace.query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PermissionService } from '../permission/permission.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';
import { Prisma } from '../generated/prisma/client.js';
import { RoleScope } from '../generated/prisma/enums.js'
import { ROLE_NAME_DEFAULT } from '../permission/constants/pemission.constants.js';
import { PERMISSION_KEYS } from '../permission/constants/pemission.constants.js';

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
      P.WORKSPACE_VIEW,
      P.PROJECT_VIEW,
      P.TASK_VIEW, P.TASK_UPDATE, P.TASK_VIEW_KEYRESULT,
      P.OUTPUT_VIEW, P.OUTPUT_CREATE, P.OUTPUT_UPDATE,
      P.EVIDENCE_VIEW, P.EVIDENCE_SUBMIT, P.EVIDENCE_UPDATE,
      P.OBJECTIVE_VIEW, P.KEY_RESULT_VIEW,
      P.METRIC_VIEW, P.FORMULA_VIEW, P.KPI_VIEW,
      P.WORKFLOW_VIEW,
    ],
  },
  {
    name: ROLE_NAME_DEFAULT.VIEWER,
    permissions: [
      P.WORKSPACE_VIEW, P.PROJECT_VIEW,
      P.TASK_VIEW, P.TASK_VIEW_KEYRESULT,
      P.OUTPUT_VIEW, P.EVIDENCE_VIEW,
      P.OBJECTIVE_VIEW, P.KEY_RESULT_VIEW,
      P.METRIC_VIEW, P.FORMULA_VIEW, P.KPI_VIEW,
      P.WORKFLOW_VIEW,
    ],
  },
];

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Tạo Workspace mới:
   * 1. Tạo bản ghi Workspace.
   * 2. Khởi tạo các Role mặc định cho Workspace (Workspace Manager, Project Lead, Member, Viewer).
   * 3. Gán Role 'Workspace Manager' cho user tạo workspace.
   */
  
  async create(createWorkspaceDto: CreateWorkspaceDto, user: AuthUser) {
    const trimmedName = createWorkspaceDto.name.trim();

    return await this.prisma.$transaction(async (tx) => {
      // 1. Tạo Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: trimmedName,
          ownerId: user.id,
        },
      });

      // 2. Lấy toàn bộ permission có trong hệ thống
      const allPermissions = await tx.permission.findMany();
      const permMap = new Map(allPermissions.map((p) => [p.key, p.id]));

      let managerRoleId: string | null = null;

      // 3. Khởi tạo roles cho workspace
      for (const roleDef of ROLE_DEFINITIONS) {
        const role = await tx.role.create({
          data: {
            workspaceId: workspace.id,
            name: roleDef.name,
            scope: RoleScope.WORKSPACE,
          },
        });

        if (roleDef.name === ROLE_NAME_DEFAULT.WORKSPACE_MANAGER) {
          managerRoleId = role.id;
        }

        // Bật role này trong workspace
        await tx.workspaceRole.create({
          data: {
            workspaceId: workspace.id,
            roleId: role.id,
          },
        });

        // Gán các permission cho role
        const rolePermIds = roleDef.permissions
          .map((k) => permMap.get(k))
          .filter((id): id is string => Boolean(id));

        if (rolePermIds.length > 0) {
          await tx.rolePermission.createMany({
            data: rolePermIds.map((permissionId) => ({
              roleId: role.id,
              permissionId,
            })),
          });
        }
      }

      // 4. Gán user làm thành viên với role 'Workspace Manager'
      if (managerRoleId) {
        await tx.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            roleId: managerRoleId,
          },
        });
      }

      return tx.workspace.findUnique({
        where: { id: workspace.id },
        include: {
          members: {
            omit:{
              userId: true,
              workspaceId: true,
              roleId: true,
            },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              role: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Lấy danh sách các workspace mà user tham gia (kèm search, phân trang, sort)
   */
  async findAll(user: AuthUser, query?: WorkspaceQueryDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkspaceWhereInput = {
      deletedAt: null,
      members: {
        some: {
          userId: user.id,
        },
      },
    };

    if (query?.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [workspaces, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query?.sortBy ?? 'createdAt']: query?.sortOrder ?? 'desc',
        },
        include: {
          members: {
            where: { userId: user.id },
            omit:{
              userId: true,
              workspaceId: true,
              roleId: true,
            },
            include: {
              role: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return {
      workspaces,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy chi tiết workspace theo id (kiểm tra quyền là member của workspace)
   */
  async findOne(id: string, user: AuthUser) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id, deletedAt: null},
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            role: {
              select: { id: true, name: true, scope: true },
            },
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.assertWorkspaceMember(workspace.id, user.id);
    return workspace;
  }

  /**
   * Cập nhật thông tin workspace (yêu cầu quyền workspace:update)
   */
  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, user: AuthUser) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id, deletedAt: null },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.assertWorkspaceMember(workspace.id, user.id);

    const data: Prisma.WorkspaceUpdateInput = {
      updatedAt: new Date(),
    };

    if (updateWorkspaceDto.name !== undefined) {
      data.name = updateWorkspaceDto.name.trim();
    }

    return this.prisma.workspace.update({
      where: { id: workspace.id },
      data,
    });
  }

  /**
   * Xóa Workspace:
   * 1. Kiểm tra quyền xóa workspace.
   * 2. Xóa workspace.
   * 3. Xóa quyền manager?
   */
  async remove(id: string, user: AuthUser) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id, deletedAt: null },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    
    const isOwner = workspace.ownerId === user.id;
    const isSuperAdmin = await this.permissionService.isSuperAdmin(user.id);
    if (!isOwner && !isSuperAdmin) {
      throw new ForbiddenException("You don't have permission to delete this workspace");
    }
    
    await this.prisma.$transaction(async tx => {
      await tx.workspace.update({
        where: { id: workspace.id },
        data: { deletedAt: new Date() },
      })

      await tx.workspaceMember.updateMany({
        where:{
          workspaceId: workspace.id,
        },
        data:{
          deletedAt: new Date()
        }
      })

    });
    
    return {
      id: workspace.id,
      name: workspace.name,
      deleted: true,
    };
  }

  /** Chỉ kiểm tra user có thuộc workspace hoặc là super admin không */
  async assertWorkspaceMember(workspaceId: string, userId: string) {

    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId, deletedAt: null, workspace: { deletedAt: null },  },
      include: { role: true },
    });
    
    if (member) return member;

    if (await this.permissionService.isSuperAdmin(userId)) return null;

    throw new ForbiddenException('You are not a member of this workspace');
  }

 
  
}
