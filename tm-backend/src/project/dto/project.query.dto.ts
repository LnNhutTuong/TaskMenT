import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProjectQueryDto {
  // 1. Phân trang (Pagination)
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

  // 2. Tìm kiếm (Search)
  @ApiPropertyOptional({ description: 'Tìm theo tên project' })
  @IsOptional()
  @IsString()
  search?: string;

  // 3. Lọc theo Workspace (rất hữu ích trong multi-tenant)
  @ApiPropertyOptional({ description: 'Lọc project theo Workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  // 4. Sắp xếp (Sorting)
  @ApiPropertyOptional({ enum: ['createdAt', 'name'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'name'])
  sortBy: 'createdAt' | 'name' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
