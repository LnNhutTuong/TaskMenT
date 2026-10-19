import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFormulaDto } from './create-formula.dto.js';
export class UpdateFormulaDto extends PartialType(OmitType(CreateFormulaDto, [
  'workspaceId',
])) {}
