// src/permission/guards/workspace.guard.ts
import {
  CanActivate,
  Injectable,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionService } from "../permission.service.js";
import { AuthUser } from "../../auth/types/jwt-payload.type.js";
import { PERMISSION_KEY } from "../decorations/permission.decoration.js";
import { IS_PUBLIC_KEY } from "../decorations/public.decorator.js";

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Endpoint @Public() → bỏ qua
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Kiểm tra xem endpoint có yêu cầu quyền hạn workspace không
    const permissionKey = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 👉 NẾU KHÔNG GẮN @RequirePermission:
    // Đây là route cấp User cá nhân (Profile, Create Workspace, List Workspaces...)
    // JwtAuthGuard đã xác thực danh tính rồi nên cho qua an toàn!
    if (!permissionKey) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    if (!user) return false;

    // 3. SUPER_ADMIN hệ thống luôn có toàn quyền
    if (await this.permissionService.isSuperAdmin(user.id)) return true;

    // 4. Lấy workspaceId linh hoạt (từ params, query, body hoặc header)
    const workspaceId =
      request.params?.workspaceId ??
      // request.params?.id ??             // Hỗ trợ cả route /workspace/:id
      request.body?.workspaceId ??
      request.query?.workspaceId ??
      request.headers['x-workspace-id'];

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required for permission check');
    }

    // 5. Kiểm tra quyền của Member trong Workspace
    const ok = await this.permissionService.hasPermission(
      workspaceId,
      user.id,
      permissionKey,
    );
    if (!ok) {
      throw new ForbiddenException(`You do not has permission`);
    }

    return true;
  }
}
