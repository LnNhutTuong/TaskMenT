import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateClassificationRuleDto {

    @IsString()
    @IsNotEmpty()
    workspaceId: string;

    @IsString()
    @IsNotEmpty()
    grade: string;

    @IsString()
    @IsNotEmpty()
    label: string;

    @IsNumber()
    @IsNotEmpty()
    @Min(0, { message: 'Min score must be at least 0' })
    @Max(10, { message: 'Max score must be at most 10' })
    minScore: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0, { message: 'Min score must be at least 0' })
    @Max(10, { message: 'Max score must be at most 10' })
    maxScore: number;

    @IsString()
    @IsOptional()
    desciption?: string;
}
