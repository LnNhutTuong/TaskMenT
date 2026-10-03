import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { OutputType } from "../../generated/prisma/enums.js";

export class CreateTaskOutputDto {

    @IsString()
    @IsNotEmpty()
    taskId: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(OutputType)
    @IsOptional()
    expectedType?: OutputType;
}
