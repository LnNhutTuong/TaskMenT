import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { EvaluationStatus } from "../../generated/prisma/enums.js";

class ReviewCriteriaResultDto {
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

export class ReviewEvaluationDto {
    @IsString()
    @IsOptional()
    reviewerComment?: string;
    @IsEnum(EvaluationStatus)
    @IsNotEmpty()
    status: EvaluationStatus;
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReviewCriteriaResultDto)
    criteriaResults: ReviewCriteriaResultDto[];
}