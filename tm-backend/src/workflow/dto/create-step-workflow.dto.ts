import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateStepDTO{
    @IsString()
    @IsNotEmpty()
    name: string       // "TODO", "IN_PROGRESS"

    @IsString()
    @IsNotEmpty()
    label: string      // "Chưa làm", "Đang làm"

    @IsBoolean()
    @IsOptional()
    isInitial?: boolean

    @IsBoolean()
    @IsOptional()
    isFinal?: boolean

    @IsString()
    @IsOptional()
    color?: string
    
    @IsNumber()
    @IsOptional()
    order?: number

}