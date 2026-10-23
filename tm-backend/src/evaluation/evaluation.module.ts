import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service.js';
import { EvaluationController } from './evaluation.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}
