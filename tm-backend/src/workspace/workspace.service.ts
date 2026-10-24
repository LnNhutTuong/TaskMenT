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
import { 
  ROLE_NAME_DEFAULT, 
  ROLE_KEY_DEFAULT, // 👈 Thêm cái này
  PERMISSION_KEYS 
} from '../permission/constants/pemission.constants.js';


const P = PERMISSION_KEYS;


// Chi owner workspace moi xoa duoc -> check them ownerId trong service
const OWNER_ONLY = [P.WORKSPACE_DELETE];

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

      // 2. Lấy tất cả các Role hệ thống áp dụng cho Workspace và Project
      const systemRoles = await tx.role.findMany({
        where: {
          scope: { in: [RoleScope.WORKSPACE, RoleScope.PROJECT] },
        },
      });

      // 3. Kích hoạt (bật) các Role này trong Workspace mới
      await tx.workspaceRole.createMany({
        data: systemRoles.map((role) => ({
          workspaceId: workspace.id,
          roleId: role.id,
        })),
      });

      // 4. Tìm Role OWNER và gán User tạo làm Owner của Workspace
      const ownerRole = systemRoles.find((role) => role.key === ROLE_KEY_DEFAULT.OWNER);
      if (!ownerRole) {
        throw new NotFoundException('Role OWNER not found in system. Please run database seed.');
      }

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          roleId: ownerRole.id,
        },
      });

      // 5. Trả về thông tin Workspace cùng các thành viên
      return tx.workspace.findUnique({
        where: { id: workspace.id },
        include: {
          members: {
            omit: {
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

  async inviteMember(workspaceId: string, userId: string){
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include:{
        members: true
      }
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if(workspace.members.some(member => member.userId === userId)){
      throw new ForbiddenException('This member is already a member in this workspace');
    }

    const role = await this.prisma.role.findFirst({
      where: {
        workspaceId: workspaceId,
        name: {
          in: ['Member']
        }
      }
    })

    console.log(">>Check role: ", role);

    // if(role){
    //   return this.prisma.workspaceMember.create({
    //     data: {
    //       workspaceId: workspaceId,
    //       userId: userId,
    //       roleId: role.id,
    //     }
    //   })
    // }
  }

  async removeMember(workspaceId: string, userId: string){
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include:{
        members: true
      }
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if(!workspace.members.some(member => member.userId === userId)){
      throw new ForbiddenException('This member is not a member in this workspace');
    }

    await this.prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
        
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
