import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CriteriaResultDto {
    @IsString()
    @IsNotEmpty()
    criteriaId: string;
    @IsNumber()
    @IsNotEmpty()
    score: number;
    @IsString()
    @IsOptional()
    comment?: string;
}

export class SelfEvaluationDto {
    @IsString()
    @IsOptional()
    selfComment?: string;
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CriteriaResultDto)
    criteriaResults: CriteriaResultDto[];
}

