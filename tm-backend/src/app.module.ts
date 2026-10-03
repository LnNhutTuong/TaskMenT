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

@Module({
  imports: [
    PrismaModule,
    TaskModule,
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
    EvidenceModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
