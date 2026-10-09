import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service.js';
import { WorkflowController } from './workflow.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectModule } from '../project/project.module.js';
import { PermissionModule } from '../permission/permission.module.js';


@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService],
  imports: [PrismaModule, AuthModule, ProjectModule, PermissionModule],
  exports: [WorkflowService]
})
export class WorkflowModule {}
