import { IsInt, IsNotEmpty } from "class-validator";

export class UpdateKeyResultProgressDto {
    @IsInt()
    @IsNotEmpty()
    currentValue: number
}
