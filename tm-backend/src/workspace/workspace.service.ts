import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthUser } from '../auth/types/jwt-payload.type.js';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}
  create(createWorkspaceDto: CreateWorkspaceDto) {
    return 'This action adds a new workspace';
  }

  findAll() {
    return `This action returns all workspace`;
  }

  async findOne(id: string, user: AuthUser) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id
      },
      include: {
        members: {
          select: {
            userId: true
            
          }
        }
      }
    })

    if(!workspace){
      throw new NotFoundException('Workspace not found')
    }

    await this.assertWorkspaceMember(workspace.id, user.id) 
    return workspace
  }

  update(id: number, updateWorkspaceDto: UpdateWorkspaceDto) {
    return `This action updates a #${id} workspace`;
  }

  remove(id: number) {
    return `This action removes a #${id} workspace`;
  }

  async assertWorkspaceMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { workspaceId, userId },
      },
    });
    if (!member) throw new ForbiddenException('You are not member of this workspace');
  }

  async assertWorkspaceAdmin(workspaceId: string, userId: string) {
  // Hiện tại chưa có RBAC → coi mọi WorkspaceMember là "admin" tạm thời
  // Sau này chỉ cần sửa hàm này để check role thực sự
  await this.assertWorkspaceMember(workspaceId, userId);

  // 🔮 Sau này khi có RBAC thay bằng:
  // const member = await this.prisma.workspaceMember.findUnique({ ... include role ... });
  // const hasPermission = member.role.permissions.some(p => p.key === 'MANAGE_METRICS');
  // if (!hasPermission) throw new ForbiddenException(...);
}

}
