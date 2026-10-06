import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateFormulaDto {
    @IsString()
    @IsNotEmpty()
    workspaceId: string;

    @IsString()
    @IsNotEmpty()
    name: string;         // "Công thức KPI nghiên cứu"

    //chuoi cong thuc
    @IsString()
    @IsNotEmpty()
    expression: string;   // "so_bai_bao * 0.6 + so_commit * 0.4"

    @IsString()
    @IsOptional()
    description?: string;
}
