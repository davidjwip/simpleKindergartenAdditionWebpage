// mathEngine.test.js — unit tests for the pure, framework-free core.
import { describe, it, expect, vi } from 'vitest';
import { makeRng } from '../src/anchorEngine';
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

function expectThrowsWithoutDrawing(generator) {
    let draws = 0;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
        draws += 1;
        if (draws > 20) {
            throw new Error('generator exceeded its draw budget');
        }
        return 0;
    });
    try {
        expect(() => generator(1)).toThrow(RangeError);
        expect(draws).toBe(0);
    } finally {
        random.mockRestore();
    }
}

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
        // zero is a legal operand at its rate; what must never happen is an item of nothing
        expect(p.num1).toBeGreaterThanOrEqual(0);
        expect(p.num2).toBeGreaterThanOrEqual(0);
        expect(p.num1 === 0 && p.num2 === 0).toBe(false);
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

    it('throws for a limit below 2 instead of spinning', () => {
        expectThrowsWithoutDrawing(generateAddition);
    });
});

describe('generateSubtraction', () => {
    it('produces a valid subtraction problem (limit 10)', () => {
        const p = generateSubtraction(10);
        expect(p.num1 - p.num2).toBe(p.answer);
        expect(p.num1).toBeGreaterThanOrEqual(p.num2);
        expect(p.answer).toBeGreaterThanOrEqual(0);
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
        result10.results.forEach(r => expect(r.answer).toBeGreaterThanOrEqual(0));
        result20.results.forEach(r => expect(r.answer).toBeGreaterThanOrEqual(0));
    });

    it('never asks 0 - 0, and only ever zero in the two shapes subtraction has', () => {
        for (const limit of [5, 10, 20]) {
            for (let i = 0; i < 400; i++) {
                const p = generateSubtraction(limit);
                expect(p.num1).toBeGreaterThanOrEqual(1);
                expect(p.num2).toBeGreaterThanOrEqual(0);
                expect(p.num2).toBeLessThanOrEqual(p.num1);
                if (p.num2 === 0) expect(p.answer).toBe(p.num1);      // n - 0 = n
                if (p.answer === 0) expect(p.num2).toBe(p.num1);      // n - n = 0
            }
        }
    });

    it('throws for a limit below 2 instead of spinning', () => {
        expectThrowsWithoutDrawing(generateSubtraction);
    });
});

describe('supported number limits', () => {
    it('generates valid items at every limit from 5 to 20 without hanging', () => {
        for (let limit = 5; limit <= 20; limit++) {
            const addition = testAddition(limit, 50);
            const subtraction = testSubtraction(limit, 50);
            expect(addition.allPassed).toBe(true);
            expect(subtraction.allPassed).toBe(true);
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


describe('zero is built in, at a rate', () => {
    // Zero is met, not drilled: at an even rate the sum constraint makes ~31% of limit-10 items
    // zero-involving (50% at limit 5). The gate keeps it incidental, and the step modes exclude it
    // because a step is the size of the number being added, and zero has no size.
    const N = 20000;

    it('carries a zero operand about one addition item in eight', () => {
        const rng = makeRng(2026);
        let zeros = 0;
        for (let i = 0; i < N; i++) {
            const p = generateAddition(10, 'any', rng);
            if (p.num1 === 0 || p.num2 === 0) zeros += 1;
        }
        expect(zeros / N).toBeGreaterThan(0.09);
        expect(zeros / N).toBeLessThan(0.16);
    });

    it('carries a zero operand about one subtraction item in eight', () => {
        const rng = makeRng(2027);
        let zeros = 0;
        for (let i = 0; i < N; i++) {
            const p = generateSubtraction(10, 'any', rng);
            // n - 0 has a zero operand; n - n has a zero answer. Both are zero items.
            if (p.num2 === 0 || p.answer === 0) zeros += 1;
        }
        expect(zeros / N).toBeGreaterThan(0.09);
        expect(zeros / N).toBeLessThan(0.16);
    });

    it('never asks an item with no numbers in it', () => {
        const rng = makeRng(11);
        for (let i = 0; i < N; i++) {
            const add = generateAddition(10, 'any', rng);
            expect(add.num1 === 0 && add.num2 === 0).toBe(false);
            const sub = generateSubtraction(10, 'any', rng);
            expect(sub.num1 === 0 && sub.num2 === 0).toBe(false);
        }
    });

    it('leaves the stepped modes free of zero, because a step has no zero size', () => {
        const rng = makeRng(12);
        for (const step of ['1', '2', '3-5']) {
            for (let i = 0; i < 500; i++) {
                const add = generateAddition(10, step, rng);
                expect(add.num2).toBeGreaterThanOrEqual(1);
                expect(add.num1).toBeGreaterThanOrEqual(1);
                expect(generateSubtraction(10, step, rng).num2).toBeGreaterThanOrEqual(1);
            }
        }
    });
});
