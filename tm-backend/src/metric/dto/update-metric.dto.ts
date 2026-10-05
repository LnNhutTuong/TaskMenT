import { PartialType } from '@nestjs/mapped-types';
import { CreateMetricDto } from './create-metric.dto.js';
import { OmitType } from '@nestjs/swagger';
export class UpdateMetricDto extends PartialType(OmitType(CreateMetricDto, ['workspaceId', 'key'])) {}
