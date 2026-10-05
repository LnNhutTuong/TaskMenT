import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMetricDto {

    @IsString()
    @IsNotEmpty()
    workspaceId: string;
    
    @IsString()
    @IsNotEmpty()
    key: string;         // Mã ngắn, unique trong workspace: "so_commit"
    
    @IsString()
    @IsNotEmpty()
    name: string;        // Tên hiển thị: "Số commit"

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    unit?: string;       // "commit", "bài", "điểm"
}
