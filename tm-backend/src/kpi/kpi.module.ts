import { Module } from '@nestjs/common';
import { KpiService } from './kpi.service.js';
import { KpiController } from './kpi.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskModule } from '../task/task.module.js';
import {FormulaEngineModule} from '../formula-engine/formula-engine.module.js'

@Module({
  imports: [PrismaModule, AuthModule, TaskModule, FormulaEngineModule],
  controllers: [KpiController],
  providers: [KpiService],
})
export class KpiModule {}
