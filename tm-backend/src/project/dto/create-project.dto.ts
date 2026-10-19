import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  workspaceId: string;
}
