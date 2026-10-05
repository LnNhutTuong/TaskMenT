import { Module } from '@nestjs/common';
import { MetricService } from './metric.service.js';
import { MetricController } from './metric.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';

@Module({
  controllers: [MetricController],
  providers: [MetricService],
  imports: [PrismaModule, AuthModule, WorkspaceModule],
  exports: [MetricService]
})
export class MetricModule {}
