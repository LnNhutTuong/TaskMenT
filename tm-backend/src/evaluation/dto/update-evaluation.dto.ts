import { PartialType } from '@nestjs/mapped-types';
import { CreateEvaluationDto } from './create-evaluation.dto.js';

export class UpdateEvaluationDto extends PartialType(CreateEvaluationDto) {}
