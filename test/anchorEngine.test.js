// anchorEngine.test.js — Increment 3c-1: make-ten passes and their blank rule.
import { describe, it, expect } from 'vitest';
import {
    buildPass,
    generateBond,
    makeRng,
    roundLengthForTotal
} from '../src/anchorEngine';

const TOTAL = 10;

function pairKey(item) {
    return `${item.num1}+${item.num2}`;
}

function orderedPairs(total) {
    const pairs = [];
    for (let num1 = 1; num1 < total; num1++) {
        pairs.push(`${num1}+${total - num1}`);
    }
    return pairs.sort();
}

function itemKeys(pass) {
    return pass.map(pairKey).sort();
}

describe('makeRng', () => {
    it('reproduces the same sequence for the same seed', () => {
        const first = makeRng(42);
        const second = makeRng(42);

        const firstDraws = Array.from({ length: 8 }, () => first());
        const secondDraws = Array.from({ length: 8 }, () => second());

        expect(firstDraws).toEqual(secondDraws);
    });

    it('advances to a different sequence for a different seed', () => {
        const first = makeRng(1);
        const second = makeRng(2);

        expect(Array.from({ length: 8 }, () => first())).not.toEqual(
            Array.from({ length: 8 }, () => second())
        );
    });
});

describe('buildPass for make-ten', () => {
    it('covers all nine ordered pairs exactly once', () => {
        const pass = buildPass(TOTAL, makeRng(7));

        expect(pass).toHaveLength(9);
        expect(itemKeys(pass)).toEqual(orderedPairs(TOTAL));
        expect(new Set(itemKeys(pass)).size).toBe(9);
    });

    it('assigns the blank to the larger operand, with 5+5 blanking num2', () => {
        const pass = buildPass(TOTAL, makeRng(11));

        const num1Blanks = pass.filter((item) => item.blankField === 'num1');
        const num2Blanks = pass.filter((item) => item.blankField === 'num2');
        const fiveFive = pass.find((item) => item.num1 === 5 && item.num2 === 5);

        expect(num1Blanks).toHaveLength(4);
        expect(num2Blanks).toHaveLength(5);
        expect(fiveFive.blankField).toBe('num2');

        for (const item of pass) {
            const largerField = item.num1 > item.num2 ? 'num1' : 'num2';
            expect(item.blankField).toBe(largerField);
        }
    });

    it('keeps every item a valid addition to the family total with no zero', () => {
        const pass = buildPass(TOTAL, makeRng(3));

        for (const item of pass) {
            expect(item.operator).toBe('+');
            expect(item.kind).toBe('bond');
            expect(item.answer).toBe(TOTAL);
            expect(item.num1 + item.num2).toBe(TOTAL);
            expect(item.num1).toBeGreaterThanOrEqual(1);
            expect(item.num2).toBeGreaterThanOrEqual(1);
        }
    });

    it('re-invokes the shuffle for a new pass from the same rng', () => {
        const rng = makeRng(99);
        const first = buildPass(TOTAL, rng);
        const second = buildPass(TOTAL, rng);

        expect(itemKeys(first)).toEqual(itemKeys(second));
        expect(first.map(pairKey)).not.toEqual(second.map(pairKey));
    });

    it('accepts the family by name or by total object', () => {
        expect(buildPass('make-ten', makeRng(4))).toHaveLength(9);
        expect(buildPass({ total: 10 }, makeRng(4))).toHaveLength(9);
    });

    it('rejects a family whose total is not a supported anchor', () => {
        expect(() => buildPass(7, makeRng(1))).toThrow(RangeError);
    });
});

describe('anchor totals 3 and 4', () => {
    it('AC1 round length doubles short families and leaves make-ten alone', () => {
        expect(roundLengthForTotal(3)).toBe(4);
        expect(roundLengthForTotal(4)).toBe(6);
        expect(roundLengthForTotal(5)).toBe(8);
        expect(roundLengthForTotal(10)).toBe(9);
    });

    it('AC2 a make-three pass is both ordered pairs, blanked on the larger operand', () => {
        const pass = buildPass(3, makeRng(7));

        expect(pass).toHaveLength(2);
        expect(itemKeys(pass)).toEqual(['1+2', '2+1'].sort());

        const byPair = new Map(pass.map((item) => [`${item.num1}+${item.num2}`, item]));
        expect(byPair.get('1+2')).toMatchObject({
            answer: 3,
            blankField: 'num2',
            kind: 'bond'
        });
        expect(byPair.get('2+1')).toMatchObject({
            answer: 3,
            blankField: 'num1',
            kind: 'bond'
        });
    });

    it('AC3 a make-four pass is its three ordered pairs', () => {
        const pass = buildPass(4, makeRng(7));

        expect(pass).toHaveLength(3);
        expect(itemKeys(pass)).toEqual(['1+3', '2+2', '3+1'].sort());

        const byPair = new Map(pass.map((item) => [`${item.num1}+${item.num2}`, item]));
        expect(byPair.get('1+3')).toMatchObject({ answer: 4, blankField: 'num2', kind: 'bond' });
        expect(byPair.get('2+2')).toMatchObject({ answer: 4, blankField: 'num2', kind: 'bond' });
        expect(byPair.get('3+1')).toMatchObject({ answer: 4, blankField: 'num1', kind: 'bond' });
    });
});

describe('generateBond', () => {
    it('builds the documented item shape for an explicit pair', () => {
        const item = generateBond(TOTAL, 'num2', 7);

        expect(item).toEqual({
            num1: 7,
            num2: 3,
            answer: TOTAL,
            operator: '+',
            blankField: 'num2',
            kind: 'bond'
        });
    });

    it('derives the blank field from the larger operand when omitted', () => {
        expect(generateBond(TOTAL, undefined, 2).blankField).toBe('num2');
        expect(generateBond(TOTAL, undefined, 8).blankField).toBe('num1');
    });

    it('draws a valid pair from the supplied rng when the first operand is omitted', () => {
        const item = generateBond(TOTAL, 'num1', undefined, makeRng(5));

        expect(item.num1).toBeGreaterThanOrEqual(1);
        expect(item.num1).toBeLessThanOrEqual(9);
        expect(item.num1 + item.num2).toBe(TOTAL);
    });
});
