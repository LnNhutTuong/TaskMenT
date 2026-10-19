import { Module } from '@nestjs/common';
import { EvaluationPeriodService } from './evaluation-period.service.js';
import { EvaluationPeriodController } from './evaluation-period.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { PermissionModule } from '../permission/permission.module.js';

@Module({
  imports: [PrismaModule, AuthModule, WorkspaceModule, PermissionModule],
  controllers: [EvaluationPeriodController],
  providers: [EvaluationPeriodService],
})
export class EvaluationPeriodModule {}
