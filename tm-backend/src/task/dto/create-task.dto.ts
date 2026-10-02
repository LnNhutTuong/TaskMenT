import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsArray,
  IsIn
} from 'class-validator';
import {  Type } from 'class-transformer';
import { PriorityLevel } from '../../generated/prisma/enums.js';
import { IsValidCustomFields } from '../custom-fields/custom-fields.validator.js';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  projectId: string

  @IsString()
  @IsNotEmpty()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date

  @IsOptional()
  @IsString()
  parentId?: string
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true }) 
  assigneeIds?: string[]

  @IsString()
  @IsOptional()
  @IsIn(['ACADEMIC', 'OPERATIONAL', 'GENERAL'])
  moduleType?: string

  @IsValidCustomFields()
  @IsOptional()
  customFields?: Record<string, unknown> 
}
