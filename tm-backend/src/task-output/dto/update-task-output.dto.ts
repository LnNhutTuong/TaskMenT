import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskOutputDto } from './create-task-output.dto.js';
import { OmitType } from '@nestjs/swagger';

export class UpdateTaskOutputDto extends PartialType(OmitType(CreateTaskOutputDto,['taskId'])) {}
