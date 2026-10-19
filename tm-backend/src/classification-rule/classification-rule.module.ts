import { Module } from '@nestjs/common';
import { ClassificationRuleService } from './classification-rule.service.js';
import { ClassificationRuleController } from './classification-rule.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PermissionModule } from '../permission/permission.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
@Module({
  imports: [PrismaModule, AuthModule, PermissionModule, WorkspaceModule],
  controllers: [ClassificationRuleController],
  providers: [ClassificationRuleService],
})
export class ClassificationRuleModule {}
