import { describe, it, expect, beforeEach } from 'vitest';
import { FormulaEngineService } from './formula-engine.service.js';

describe('FormulaEngineService', () => {
  let service: FormulaEngineService;

  beforeEach(() => {
    service = new FormulaEngineService();
  });

  describe('extractVariables', () => {
    it('trich xuat bien tu cong thuc co ban', () => {
      const vars = service.extractVariables('x * 2 + y');
      expect(vars).toEqual(expect.arrayContaining(['x', 'y']));
      expect(vars).toHaveLength(2);
    });

    it('khong lay ten ham lam bien', () => {
      const vars = service.extractVariables('sqrt(x) + min(a, b)');
      expect(vars).not.toContain('sqrt');
      expect(vars).not.toContain('min');
      expect(vars).toEqual(expect.arrayContaining(['x', 'a', 'b']));
      expect(vars).toHaveLength(3);
    });

    it('tra ve mang rong neu chi co so', () => {
      const vars = service.extractVariables('42 + 10');
      expect(vars).toHaveLength(0);
    });

    it('loai bo bien trung lap', () => {
      const vars = service.extractVariables('x + x * y');
      expect(vars).toEqual(expect.arrayContaining(['x', 'y']));
      expect(vars).toHaveLength(2);
    });

    it('throw neu expression rong', () => {
      expect(() => service.extractVariables('')).toThrow();
    });
  });

  describe('validate', () => {
    it('cong thuc hop le khong throw', () => {
      expect(() => service.validate('x * 2 + y')).not.toThrow();
    });

    it('luy thua dung mathjs: 2^3 = 8', () => {
      expect(() => service.validate('x^3')).not.toThrow();
      const result = service.evaluate('x^3', { x: 2 });
      expect(result).toBe(8);
    });

    it('ham trong whitelist khong throw', () => {
      expect(() => service.validate('sqrt(x) + min(a, b)')).not.toThrow();
      expect(() => service.validate('abs(x)')).not.toThrow();
      expect(() => service.validate('pow(x, 2)')).not.toThrow();
      expect(() => service.validate('round(x)')).not.toThrow();
      expect(() => service.validate('floor(x)')).not.toThrow();
      expect(() => service.validate('ceil(x)')).not.toThrow();
    });

    it('ham ngoai whitelist throw error', () => {
      expect(() => service.validate('sin(x)')).toThrow();
      expect(() => service.validate('cos(x)')).toThrow();
      expect(() => service.validate('log(x)')).toThrow();
    });

    it('chia cho 0 throw error', () => {
      expect(() => service.validate('x / 0')).toThrow();
    });

    it('tu khoa nguy hiem throw error', () => {
      expect(() => service.validate('x + process.env')).toThrow();
      expect(() => service.validate('import("fs")')).toThrow();
    });

    it('expression rong throw error', () => {
      expect(() => service.validate('')).toThrow();
    });
  });

  describe('evaluate', () => {
    it('tinh toan co ban', () => {
      expect(service.evaluate('x + y', { x: 3, y: 4 })).toBe(7);
    });

    it('tinh luy thua', () => {
      expect(service.evaluate('x^2', { x: 5 })).toBe(25);
    });

    it('tinh voi ham', () => {
      expect(service.evaluate('sqrt(x)', { x: 16 })).toBe(4);
      expect(service.evaluate('min(a, b)', { a: 3, b: 7 })).toBe(3);
    });

    it('ket qua Infinity throw error', () => {
      expect(() => service.evaluate('x / y', { x: 1, y: 0 })).toThrow();
    });

    it('thieu bien throw error', () => {
      expect(() => service.evaluate('x + y', { x: 1 })).toThrow();
    });
  });
});

