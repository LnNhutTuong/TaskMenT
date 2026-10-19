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
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  // --- Lọc theo Project & Subtask ---
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  // --- Lọc theo trạng thái và độ ưu tiên ---
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  // --- Tìm kiếm ---
  @IsOptional()
  @IsString()
  search?: string;

  // --- Sắp xếp (Dùng enum) ---
  @IsOptional()
  @IsEnum(TaskSortBy)
  sortBy: TaskSortBy = TaskSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
