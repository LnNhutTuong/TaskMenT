import { evaluate, parse } from 'mathjs';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FormulaEngineService {

  // Trích xuất tên biến từ expression
  extractVariables(expression: string): string[] {
    const node = parse(expression);
    const variables: string[] = [];
    node.traverse((node: any) => {
      if (node.type === 'SymbolNode') {
        variables.push(node.name);
      }
    });
    return [...new Set(variables)];
  }

  // Tính toán kết quả với scope là map {key: value}
  evaluate(expression: string, scope: Record<string, number>): number {
    try {
      const result = evaluate(expression, scope);
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new BadRequestException('Formula produced an invalid result');
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(`Formula evaluation error: ${e.message}`);
    }
  }
}