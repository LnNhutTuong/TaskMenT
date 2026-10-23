import { IsNotEmpty, IsString } from "class-validator";

export class GenearateEvaluationDto {
    @IsString()
    @IsNotEmpty()
    periodId: string;
}
