import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PriorityLevel } from '../../generated/prisma/enums.js';

// 1. Enum cho các trường cho phép sắp xếp
export enum TaskSortBy {
  CREATED_AT = 'createdAt',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  TITLE = 'title',
}

// 2. Enum cho chiều sắp xếp
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class TaskQueryDTO {
  // --- Phân trang ---
  @ApiPropertyOptional({ default: 1, description: 'Số trang' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Số lượng item mỗi trang' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  // --- Lọc theo Project & Subtask ---
  @ApiPropertyOptional({ description: 'Lọc task theo Project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo Task cha (để lấy danh sách Subtask)',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  // --- Lọc theo trạng thái và độ ưu tiên ---
  @ApiPropertyOptional({ description: 'Trạng thái task (TODO, IN_PROGRESS, DONE...)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: PriorityLevel })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: 'Lọc theo ngày hết hạn' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  // --- Tìm kiếm ---
  @ApiPropertyOptional({ description: 'Tìm kiếm theo title hoặc description' })
  @IsOptional()
  @IsString()
  search?: string;

  // --- Sắp xếp (Dùng enum) ---
  @ApiPropertyOptional({
    enum: TaskSortBy,
    default: TaskSortBy.CREATED_AT,
    description: 'Trường sắp xếp',
  })
  @IsOptional()
  @IsEnum(TaskSortBy)
  sortBy: TaskSortBy = TaskSortBy.CREATED_AT;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'Chiều sắp xếp (asc hoặc desc)',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
