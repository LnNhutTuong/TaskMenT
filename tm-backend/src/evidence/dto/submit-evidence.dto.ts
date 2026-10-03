import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SubmitEvidenceDto {
    @IsString()
    @IsNotEmpty()
    taskOutputId: string;

    @IsString()
    @IsNotEmpty()
    fileUrl: string;       // URL file hoặc link tài liệu

    @IsString()
    @IsOptional()
    fileName?: string;     // Tên file gốc (ví dụ: "bao-cao-q3.pdf")

    @IsString()
    @IsOptional()
    mimeType?: string;     // Kiểu mime (ví dụ: "application/pdf")
}
