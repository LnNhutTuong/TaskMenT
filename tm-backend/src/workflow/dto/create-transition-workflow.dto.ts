import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateTransitionDTO{

    @IsString()
    @IsNotEmpty()
    fromStepName: string

    @IsString()
    @IsNotEmpty()
    toStepName: string

    @IsString()
    @IsOptional()
    label?: string
}