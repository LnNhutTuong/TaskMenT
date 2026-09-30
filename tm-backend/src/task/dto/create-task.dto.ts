import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsArray,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PriorityLevel } from '../../generated/prisma/enums.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @IsArray()
  @IsString({ each: true }) 
  parentId?: string
  
  @IsOptional()
  @IsString()
  assigneeIds?: string[]

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown> 
}
