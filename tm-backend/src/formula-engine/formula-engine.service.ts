import { create, all } from 'mathjs';
import { Injectable, BadRequestException } from '@nestjs/common';

const math = create(all);

const ALLOWED_FUNCTIONS = new Set([
  'min', 'max', 'abs', 'round', 'floor', 'ceil', 'sqrt', 'pow',
]);

@Injectable()
export class FormulaEngineService {

  extractVariables(expression: string): string[] {
    this.assertSafeExpression(expression);
    const node = math.parse(expression);
    const variables: string[] = [];
    this.collectVariables(node, variables);
    return [...new Set(variables)];
  }

  validate(expression: string): void {
    this.assertSafeExpression(expression);
    const node = math.parse(expression);
    this.walkTree(node);

    const variables = this.extractVariables(expression);
    const scope: Record<string, number> = {};
    for (const v of variables) {
      scope[v] = 1;
    }
    try {
      const result = math.evaluate(expression, scope);
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new BadRequestException('Expression does not evaluate to a valid number');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Invalid mathematical expression: ${e.message}`);
    }
  }

  evaluate(expression: string, scope: Record<string, number>): number {
    this.assertSafeExpression(expression);
    try {
      const result = math.evaluate(expression, scope);
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new BadRequestException('Formula produced an invalid result');
      }
      return result;
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Formula evaluation error: ${e.message}`);
    }
  }

  private collectVariables(node: any, variables: string[]): void {
    if (!node) return;

    switch (node.type) {
      case 'ConstantNode':
        break;
      case 'SymbolNode':
        variables.push(node.name);
        break;
      case 'FunctionNode': {
        const fnName = node.fn?.name || '';
        if (!ALLOWED_FUNCTIONS.has(fnName)) {
          throw new BadRequestException(`Function not allowed: ${fnName}`);
        }
        for (const arg of node.args || []) {
          this.collectVariables(arg, variables);
        }
        break;
      }
      case 'OperatorNode':
        for (const arg of node.args || []) {
          this.collectVariables(arg, variables);
        }
        break;
      case 'ParenthesisNode':
        this.collectVariables(node.content, variables);
        break;
      default:
        throw new BadRequestException(`Unsupported expression syntax: ${node.type}`);
    }
  }

  private walkTree(node: any): void {
    if (!node) return;

    switch (node.type) {
      case 'ConstantNode':
      case 'SymbolNode':
        break;
      case 'FunctionNode': {
        const fnName = node.fn?.name || '';
        if (!ALLOWED_FUNCTIONS.has(fnName)) {
          throw new BadRequestException(`Function not allowed: ${fnName}`);
        }
        for (const arg of node.args || []) {
          this.walkTree(arg);
        }
        break;
      }
      case 'OperatorNode':
        for (const arg of node.args || []) {
          this.walkTree(arg);
        }
        break;
      case 'ParenthesisNode':
        this.walkTree(node.content);
        break;
      default:
        throw new BadRequestException(`Unsupported expression syntax: ${node.type}`);
    }
  }

  private assertSafeExpression(expression: string): void {
    if (!expression || typeof expression !== 'string') {
      throw new BadRequestException('Expression must be a non-empty string');
    }
    const dangerousPattern = /import|require|process|global|__proto__|constructor|prototype/;
    if (dangerousPattern.test(expression)) {
      throw new BadRequestException('Expression contains forbidden keywords');
    }
  }
}

