import { Module } from '@nestjs/common';
import { FormulaService } from './formula.service.js';
import { FormulaController } from './formula.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { TaskModule } from '../task/task.module.js';
@Module({
  controllers: [FormulaController],
  providers: [FormulaService],
  imports: [PrismaModule, AuthModule, WorkspaceModule, TaskModule]
})
export class FormulaModule { }
