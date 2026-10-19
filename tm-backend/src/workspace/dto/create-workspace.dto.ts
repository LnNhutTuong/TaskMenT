import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsNotEmpty({ message: 'Workspace name cannot be empty' })
  @MaxLength(100, { message: 'Workspace name cannot exceed 100 characters' })
  name: string;
}
