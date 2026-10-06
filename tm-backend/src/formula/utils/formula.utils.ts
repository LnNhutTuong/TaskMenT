import { BadRequestException } from '@nestjs/common';

/**
 * Trích xuất danh sách tên biến (metric key) từ biểu thức toán học.
 * Ví dụ: "so_bai_bao * 0.6 + so_commit * 0.4" => ["so_bai_bao", "so_commit"]
 */
export function extractVariables(expression: string): string[] {
  if (!expression || typeof expression !== 'string') {
    throw new BadRequestException('Expression must be a non-empty string');
  }

  // Regex tìm các identifier hợp lệ: bắt đầu bằng chữ hoặc dấu gạch dưới, theo sau là chữ, số hoặc gạch dưới
  const identifierRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
  const matches = expression.match(identifierRegex) || [];

  // Danh sách các từ khóa hàm toán học (nếu bạn cho phép dùng hàm như sqrt, min, max, abs)
  const mathKeywords = new Set([
    'min', 'max', 'abs', 'round', 'floor', 'ceil', 'sqrt', 'pow'
  ]);

  // Lọc bỏ từ khóa toán học và loại bỏ trùng lặp (Set)
  const variables = matches.filter((token) => !mathKeywords.has(token));
  return Array.from(new Set(variables));
}

/**
 * Kiểm tra sơ bộ cú pháp biểu thức toán học bằng cách thế số thử (Dry Run)
 */
export function validateExpressionSyntax(expression: string, sampleVariables: string[]): void {
  // Thay thế toàn bộ các biến bằng số 1 để test cú pháp
  let testExpr = expression;
  for (const v of sampleVariables) {
    // Thay thế toàn bộ từ độc lập bằng số 1
    const regex = new RegExp(`\\b${v}\\b`, 'g');
    testExpr = testExpr.replace(regex, '1');
  }

  // Chặn các ký tự nguy hiểm không phải toán học (chống code injection / eval độc hại)
  const safeMathRegex = /^[0-9+\-*/().\s^%]+$/;
  if (!safeMathRegex.test(testExpr)) {
    throw new BadRequestException('Expression contains invalid characters or operators');
  }

  try {
    // Chạy thử với Function an toàn để kiểm tra cú pháp (ngoặc, dấu toán tử)
    // Lưu ý: testExpr chỉ chứa số và toán tử (+ - * / ( ))
    const testResult = new Function(`"use strict"; return (${testExpr})`)();
    if (typeof testResult !== 'number' || isNaN(testResult)) {
      throw new BadRequestException('Expression does not evaluate to a valid number');
    }
  } catch (error) {
    throw new BadRequestException(`Invalid mathematical expression syntax: ${error}`);
  }
}
