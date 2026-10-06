import { PartialType } from '@nestjs/mapped-types';
import { CreateFormulaDto } from './create-formula.dto.js';
import { OmitType } from '@nestjs/swagger';
export class UpdateFormulaDto extends PartialType(OmitType(CreateFormulaDto, [
  'workspaceId',
])) {}
