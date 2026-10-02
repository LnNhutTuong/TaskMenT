import {ValidateNested,  IsArray, IsNotEmpty, IsString} from "class-validator";
import { Type } from "class-transformer";
import { CreateStepDTO } from "./create-step-workflow.dto.js";
import { CreateTransitionDTO } from "./create-transition-workflow.dto.js";

export class CreateWorkflowDto {
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStepDTO)
    steps: CreateStepDTO[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTransitionDTO)
    transitions: CreateTransitionDTO[];
}
