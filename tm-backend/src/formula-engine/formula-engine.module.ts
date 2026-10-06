import { Module } from '@nestjs/common';
import { FormulaEngineService } from './formula-engine.service.js';

@Module({
  providers: [FormulaEngineService],
  exports: [FormulaEngineService]
})
export class FormulaEngineModule {}
