import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkflowDto } from './create-workflow.dto.js';

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {}
