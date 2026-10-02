import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class UpdateKeyResultProgressDto {
    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    currentValue: number
}
