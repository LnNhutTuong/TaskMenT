import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TaskModule } from './task/task.module.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { PasswordModule } from './common/password/password.module.js';
import { ProjectModule } from './project/project.module.js';
import { ObjectiveModule } from './objective/objective.module.js';
import { KeyResultModule } from './key-result/key-result.module.js';
import { WorkspaceModule } from './workspace/workspace.module.js';
import { WorkflowModule } from './workflow/workflow.module.js';
import { TaskOutputModule } from './task-output/task-output.module.js';
import { EvidenceModule } from './evidence/evidence.module.js';
import { MetricModule } from './metric/metric.module.js';
import { TaskMetricValueModule } from './task-metric-value/task-metric-value.module.js';
import { FormulaModule } from './formula/formula.module.js';
import { FormulaEngineModule } from './formula-engine/formula-engine.module.js';
import { KpiModule } from './kpi/kpi.module.js';
import { PermissionModule } from './permission/permission.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { APP_GUARD } from '@nestjs/core';
import { SystemGuard } from './permission/guards/system.guard.js';
import { WorkspaceGuard } from './permission/guards/workspace.guard.js';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupModule } from './utils/cleanup/cleanup.module.js';

@Module({
  imports: [
    PrismaModule,
    TaskModule,
    ScheduleModule.forRoot(),
    CleanupModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PasswordModule,
    ProjectModule,
    ObjectiveModule,
    KeyResultModule,
    WorkspaceModule,
    WorkflowModule,
    TaskOutputModule,
    EvidenceModule,
    MetricModule,
    TaskMetricValueModule,
    FormulaModule,
    FormulaEngineModule,
    KpiModule,
    PermissionModule
  ],

  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: WorkspaceGuard
    },
    

  ],
})
export class AppModule {}
