import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PriorityLevel } from '../../generated/prisma/enums.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty({
    description: 'Task title',
    example: 'Learn Swagger',
  })
  title: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Learn Swagger to use OpenAPI',
  })
  description?: string;

  @IsString()
  @ApiProperty({
    description: 'Task status',
    example: 'TODO',
  })
  status: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @ApiPropertyOptional({
    description: 'Task deadline',
    example: '2026-09-20T14:00:00.000Z',
  })
  deadline?: Date;

  @IsOptional()
  @IsEnum(PriorityLevel)
  @ApiProperty({
    description: 'Task priority',
    enum: PriorityLevel,
    enumName: 'PriorityLevel',
    example: 'HIGH',
  })
  priority?: PriorityLevel;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}
