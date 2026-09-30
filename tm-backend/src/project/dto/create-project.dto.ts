import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @ApiProperty({
    description: 'Project name',
    example: 'Platform team backlog',
  })
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Track product and engineering tasks in one place.',
  })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'User IDs to add as project members',
    type: [String],
    example: ['c1e8f112-0e91-4a7f-8dd8-9c6f862f0cb2'],
  })
  memberIds?: string[];

  workspaceId: string;
}
