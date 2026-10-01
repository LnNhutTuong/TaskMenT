import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDTO {
  @IsEmail()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password123', format: 'password' })
  password: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  name: string;
}
