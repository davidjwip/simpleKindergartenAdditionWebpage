// mathEngine.test.js — unit tests for the pure, framework-free core.
import { describe, it, expect } from 'vitest';
import {
    generateNumbers,
    generateAddition,
    generateSubtraction,
    pickRandomField,
    evaluateAnswer,
    testAddition,
    testSubtraction,
    testRandomField
} from '../src/mathEngine';

describe('generateNumbers', () => {
    it('returns two numbers within the requested limit', () => {
        for (let i = 0; i < 50; i++) {
            const { num1, num2 } = generateNumbers(10);
            expect(num1).toBeGreaterThanOrEqual(1);
            expect(num2).toBeGreaterThanOrEqual(1);
            expect(num1).toBeLessThanOrEqual(10);
            expect(num2).toBeLessThanOrEqual(10);
        }
    });
});

describe('generateAddition', () => {
    it('produces a valid addition problem (limit 10)', () => {
        const p = generateAddition(10);
        expect(p.num1 + p.num2).toBe(p.answer);
        expect(p.num1).toBeGreaterThanOrEqual(1);
        expect(p.num2).toBeGreaterThanOrEqual(1);
        expect(p.num1).toBeLessThanOrEqual(10);
        expect(p.num2).toBeLessThanOrEqual(10);
        expect(p.answer).toBeLessThanOrEqual(10);
    });

    it('produces a valid addition problem (limit 20)', () => {
        const p = generateAddition(20);
        expect(p.num1 + p.num2).toBe(p.answer);
        expect(p.answer).toBeLessThanOrEqual(20);
    });

    it('all generated problems pass the built-in verification (limit 10 and 20)', () => {
        expect(testAddition(10, 50).allPassed).toBe(true);
        expect(testAddition(10, 50).results.length).toBe(50);
        expect(testAddition(20, 50).allPassed).toBe(true);
        expect(testAddition(20, 50).results.length).toBe(50);
    });
});

describe('generateSubtraction', () => {
    it('produces a valid subtraction problem (limit 10)', () => {
        const p = generateSubtraction(10);
        expect(p.num1 - p.num2).toBe(p.answer);
        expect(p.num1).toBeGreaterThanOrEqual(p.num2);
        expect(p.answer).toBeGreaterThanOrEqual(1);
    });

    it('produces a valid subtraction problem (limit 20)', () => {
        const p = generateSubtraction(20);
        expect(p.num1 - p.num2).toBe(p.answer);
        expect(p.num1).toBeGreaterThanOrEqual(p.num2);
    });

    it('all generated problems pass the strict check (limit 10 and 20)', () => {
        const result10 = testSubtraction(10, 50);
        const result20 = testSubtraction(20, 50);
        expect(result10.allPassed).toBe(true);
        expect(result20.allPassed).toBe(true);
        result10.results.forEach(r => expect(r.answer).toBeGreaterThanOrEqual(1));
        result20.results.forEach(r => expect(r.answer).toBeGreaterThanOrEqual(1));
    });

    it('generates subtraction problems without zeros (limit 10)', () => {
        for (let i = 0; i < 100; i++) {
            const p = generateSubtraction(10);
            expect(p.num2).toBeGreaterThanOrEqual(1);
            expect(p.num1).toBeGreaterThanOrEqual(2);
            expect(p.answer).toBeGreaterThanOrEqual(1);
        }
    });

    it('generates subtraction problems without zeros (limit 20)', () => {
        for (let i = 0; i < 100; i++) {
            const p = generateSubtraction(20);
            expect(p.num2).toBeGreaterThanOrEqual(1);
            expect(p.num1).toBeGreaterThanOrEqual(2);
            expect(p.answer).toBeGreaterThanOrEqual(1);
        }
    });
});

describe('pickRandomField', () => {
    it('distributes across all three fields with reasonable uniformity', () => {
        const result = testRandomField(1000);
        expect(result.passed).toBe(true);
        expect(result.fieldCounts.num1 + result.fieldCounts.num2 + result.fieldCounts.answer).toBe(1000);
    });
});

describe('evaluateAnswer', () => {
    it('checks addition correctly', () => {
        expect(evaluateAnswer(2, 3, 5, '+')).toBe(true);
        expect(evaluateAnswer(2, 3, 6, '+')).toBe(false);
        expect(evaluateAnswer(0, 0, 0, '+')).toBe(true);
    });

    it('checks subtraction correctly', () => {
        expect(evaluateAnswer(5, 3, 2, '-')).toBe(true);
        expect(evaluateAnswer(5, 3, 1, '-')).toBe(false);
        expect(evaluateAnswer(3, 3, 0, '-')).toBe(true);
    });

    it('returns null for incomplete/invalid input', () => {
        expect(evaluateAnswer(parseInt('', 10), 3, 5, '+')).toBe(null);
        expect(evaluateAnswer(2, 3, parseInt('foo', 10), '+')).toBe(null);
        expect(evaluateAnswer(2, 3, 5, '-')).not.toBe(null);
    });

    it('returns null when a raw empty string reaches the checker', () => {
        expect(evaluateAnswer('', 4, 7, '+')).toBe(null);
        expect(evaluateAnswer(3, '', 7, '+')).toBe(null);
        expect(evaluateAnswer(3, 4, '', '+')).toBe(null);
    });

    it('returns null when a missing value reaches the checker', () => {
        expect(evaluateAnswer(null, 4, 7, '+')).toBe(null);
        expect(evaluateAnswer(3, null, 7, '+')).toBe(null);
        expect(evaluateAnswer(3, 4, null, '+')).toBe(null);
        expect(evaluateAnswer(undefined, 4, 7, '+')).toBe(null);
        expect(evaluateAnswer(3, undefined, 7, '+')).toBe(null);
        expect(evaluateAnswer(3, 4, undefined, '+')).toBe(null);
    });
});
