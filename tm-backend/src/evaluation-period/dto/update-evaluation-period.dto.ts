import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateEvaluationPeriodDto } from './create-evaluation-period.dto.js';

export class UpdateEvaluationPeriodDto extends PartialType(OmitType(CreateEvaluationPeriodDto, ['workspaceId'])) {}
