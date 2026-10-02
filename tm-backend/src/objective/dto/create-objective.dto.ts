import { IsDate, IsNotEmpty, IsOptional, IsString, } from "class-validator";
import { Type } from "class-transformer";

export class CreateObjectiveDto {
    @IsString()
    @IsNotEmpty()
    workspaceId: string;

    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsOptional()
    description?: string
    
    @IsString()
    @IsOptional()
    projectId?: string

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    startDate?: Date

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    endDate?: Date
}
