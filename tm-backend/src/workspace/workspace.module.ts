import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service.js';
import { WorkspaceController } from './workspace.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  imports: [AuthModule, PrismaModule, PermissionModule],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
