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
  @IsString()
  parentId?: string
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true }) 
  assigneeIds?: string[]

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any> 
}
