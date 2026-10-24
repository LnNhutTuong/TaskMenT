import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service.js"
import { RoleScope } from '../generated/prisma/enums.js';
import { ROLE_NAME_DEFAULT } from './constants/pemission.constants.js';

@Injectable()
export class PermissionService {

    constructor(private readonly prisma: PrismaService) { }

    // ─── SYSTEM LEVEL ───────────────────────────────────────────────────────────
    async isSuperAdmin(userId: string): Promise<boolean>{
        const userRole = await this.prisma.userRole.findFirst({
            where:{
                userId,
                role:{
                    scope: RoleScope.SYSTEM,
                    OR: [
                        { name: 'SUPER_ADMIN' },
                        { name: ROLE_NAME_DEFAULT.SUPER_ADMIN },
                        { key: 'SUPER_ADMIN' },
                    ]
                }
            }
        })

        return Boolean(userRole)
    }

    async assertSuperAdmin(userId: string): Promise<void> {
        const ok = await this.isSuperAdmin( userId);
        if (!ok) {
        throw new ForbiddenException(`You are not Super Admin`);
        }
    }


    // ───  WORKSPACE & PROJECT LEVEL ───────────────────────────────────────────────────────────
    /** Trả về boolean, không ném lỗi. Không phải member thì cũng là false */
    async hasPermission(workspaceId: string, userId: string, permissionKey: string, projectId?: string): Promise<boolean> {
      if (await this.isSuperAdmin(userId)) return true;

      const member = await this.prisma.workspaceMember.findUnique({
        where: { 
          userId_workspaceId: { userId, workspaceId },
          AND: [
            { deletedAt: null },
            { user: { deletedAt: null } },
            { workspace: { deletedAt: null } }
          ]
        },
        select: {
          role: {
            select: {
              name: true,
              // chỉ lấy đúng quyền cần kiểm tra, không load cả list
              permissions: {
                where: { permission: { key: permissionKey } },
                select: { permissionId: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!member) return false;
      if (member.role.permissions.length > 0) return true;
      if (!projectId) return false;

      const projectMember = await this.prisma.projectMember.findFirst({
        where: {
          projectId,
          userId,
          deletedAt: null,
          project: {
            workspaceId,
            deletedAt: null,
          },
        },
        select: {
          role: {
            select: {
              permissions: {
                where: { permission: { key: permissionKey } },
                select: { permissionId: true },
                take: 1,
              },
            },
          },
        },
      });

      return (projectMember?.role?.permissions.length ?? 0) > 0;
    }
    
    /** Ném lỗi nếu không có quyền */
    async assertPermission(workspaceId: string, userId: string, permissionKey: string, projectId?: string): Promise<void> {
        const ok = await this.hasPermission(workspaceId, userId, permissionKey, projectId);
        if (!ok) {
          throw new ForbiddenException(`You do not have permission`);
        }
    }

    /** Ném lỗi nếu không có ít nhất 1 trong các quyền đó */
    async assertSomePermission(workspaceId: string, userId: string, permissionKeys: string[], projectId?: string): Promise<void> {
      const ok  = await Promise.all(permissionKeys.map(key => this.hasPermission(workspaceId, userId, key, projectId)));
      if (!ok.some(Boolean)) {
        throw new ForbiddenException('You do not have permission');
      }
    }
}
