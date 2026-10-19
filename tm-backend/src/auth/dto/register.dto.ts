import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDTO {
  @IsEmail()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsOptional()
  name: string;
}
