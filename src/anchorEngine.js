/**
 * anchorEngine.js — pure generators for the anchor-fact families.
 *
 * Only the anchor pass uses the seedable rng; the existing generators in
 * mathEngine.js keep asking Math.random() directly.
 */

const SUPPORTED_TOTALS = [3, 4, 5, 10];
const DOUBLES_MAX = 5;
const NAMED_FAMILIES = {
    'make-five': 5,
    'make-ten': 10,
    doubles: 10,
    bond5: 5,
    bond10: 10
};

function resolvesToDoubles(family) {
    return family === 'doubles' ||
        (family !== null && typeof family === 'object' && family.kind === 'doubles');
}

export function numericTotal(family) {
    let total;
    if (typeof family === 'number') {
        total = family;
    } else if (typeof family === 'string') {
        total = NAMED_FAMILIES[family];
    } else if (family && Number.isFinite(family.total)) {
        total = family.total;
    }
    if (!SUPPORTED_TOTALS.includes(total)) {
        throw new RangeError(`Unknown anchor family: ${family}`);
    }
    return total;
}

function pairsFor(total) {
    const pairs = [];
    for (let num1 = 1; num1 < total; num1++) {
        pairs.push({ num1, num2: total - num1 });
    }
    return pairs;
}

function blankFieldForPair(num1, num2) {
    return num1 > num2 ? 'num1' : 'num2';
}

function shuffle(items, rng) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(rng() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

export function makeRng(seed = Date.now()) {
    let state = (Number(seed) >>> 0) || 0x9e3779b9;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

export function roundLengthForTotal(family) {
    if (resolvesToDoubles(family)) return DOUBLES_MAX;
    const total = numericTotal(family);
    return total === 10 ? 9 : (total - 1) * 2;
}

export function trackLengthForTotal(family) {
    return roundLengthForTotal(family);
}

export function generateBond(total, blankField, num1, rng = Math.random) {
    const resolvedTotal = numericTotal(total);
    const chosenNum1 = num1 == null
        ? Math.floor(rng() * (resolvedTotal - 1)) + 1
        : num1;
    const num2 = resolvedTotal - chosenNum1;
    return {
        num1: chosenNum1,
        num2,
        answer: resolvedTotal,
        operator: '+',
        blankField: blankField == null ? blankFieldForPair(chosenNum1, num2) : blankField,
        kind: 'bond'
    };
}

export function generateDoubles(value) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > DOUBLES_MAX) {
        throw new RangeError(`Unknown doubles value: ${value}`);
    }
    return {
        num1: num,
        num2: num,
        answer: num * 2,
        operator: '+',
        blankField: 'answer',
        kind: 'doubles'
    };
}

export function buildPass(family, rng = Math.random) {
    // doubles first: {kind: 'doubles'} carries no total, so numericTotal would throw on it
    if (resolvesToDoubles(family)) {
        return shuffle(
            Array.from({ length: DOUBLES_MAX }, (_, index) => generateDoubles(index + 1)),
            rng
        );
    }
    const total = numericTotal(family);
    return shuffle(pairsFor(total), rng).map(({ num1, num2 }) => (
        generateBond(total, blankFieldForPair(num1, num2), num1, rng)
    ));
}
