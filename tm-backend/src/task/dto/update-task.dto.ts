import { IsString, IsOptional, IsEnum, IsDate, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { PriorityLevel } from '../../generated/prisma/enums.js';
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  deadline?: Date;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}
