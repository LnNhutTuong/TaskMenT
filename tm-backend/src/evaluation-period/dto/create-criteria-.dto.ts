import { IsNumber, IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCriteriaDto{
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsString()
    @IsOptional()
    description?: string;
    @IsNumber()
    @IsNotEmpty()
    maxScore: number;
}