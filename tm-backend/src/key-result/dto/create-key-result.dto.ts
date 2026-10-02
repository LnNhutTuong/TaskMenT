import { IsNotEmpty, IsString, IsOptional, IsInt } from "class-validator"

export class CreateKeyResultDto {
    @IsString()
    @IsNotEmpty()
    objectiveId: string       // bắt buộc

    @IsString()
    @IsNotEmpty()
    title: string             // bắt buộc

    @IsString()
    @IsOptional()
    description?: string

    @IsInt()
    @IsOptional()
    startValue?: number       // default 0

    @IsInt()
    @IsNotEmpty()
    targetValue: number       // bắt buộc (đích cần đạt)

    @IsString()
    @IsNotEmpty()
    unit: string             // ví dụ: "%", "task", "VND"
}
