import { Module } from '@nestjs/common';
import { TaskService } from './task.service.js';
import { TaskController } from './task.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { PermissionModule } from '../permission/permission.module.js';
@Module({
  providers: [TaskService],
  controllers: [TaskController],
  imports: [PrismaModule, AuthModule, WorkflowModule, PermissionModule],
  exports: [TaskService]
})
export class TaskModule {}
