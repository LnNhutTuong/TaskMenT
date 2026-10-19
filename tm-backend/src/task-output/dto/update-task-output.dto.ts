import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTaskOutputDto } from './create-task-output.dto.js';

export class UpdateTaskOutputDto extends PartialType(OmitType(CreateTaskOutputDto,['taskId'])) {}
