import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProjectQueryDto {
  // 1. Phân trang (Pagination)
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

  // 2. Tìm kiếm (Search)
  @IsOptional()
  @IsString()
  search?: string;

  // 3. Lọc theo Workspace (rất hữu ích trong multi-tenant)
  @IsOptional()
  @IsString()
  workspaceId?: string;

  // 4. Sắp xếp (Sorting)
  @IsOptional()
  @IsIn(['createdAt', 'name'])
  sortBy: 'createdAt' | 'name' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
