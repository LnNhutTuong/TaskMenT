import { Type } from "class-transformer";
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsString, ValidateNested} from "class-validator";
import { CreateCriteriaDto } from "./create-criteria-.dto.js";

export class CreateEvaluationPeriodDto {

    @IsString()
    @IsNotEmpty()
    workspaceId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    startDate: Date;

    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    endDate: Date;

    @IsNumber()
    @IsNotEmpty()
    kpiWeight: number;

    @IsNumber()
    @IsNotEmpty()
    criteriaWeight: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCriteriaDto)
    criteria: CreateCriteriaDto[];

}
