import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateClassificationRuleDto } from './create-classification-rule.dto.js';

export class UpdateClassificationRuleDto extends PartialType(OmitType(CreateClassificationRuleDto, ['workspaceId'])) {}
