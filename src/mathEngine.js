/**
 * mathEngine.js — Pure math game logic, free of any DOM or framework
 * dependencies. This is the unit-testable core, migrated from the pure
 * helpers in the original math-game.js so it ports across to React or
 * Vue equally well.
 */

export function generateNumbers(maxLimit) {
    const num1 = Math.floor(Math.random() * maxLimit) + 1;
    const num2 = Math.floor(Math.random() * maxLimit) + 1;
    return { num1, num2 };
}

const MIN_GENERATABLE_LIMIT = 2;

function assertGeneratableLimit(maxLimit) {
    if (!(maxLimit >= MIN_GENERATABLE_LIMIT)) {
        throw new RangeError(`A number limit of at least ${MIN_GENERATABLE_LIMIT} is required`);
    }
}

export const STEPS = ['1', '2', '3-5', 'any'];

function assertStep(step) {
    if (!STEPS.includes(step)) {
        throw new RangeError(`Unknown step: ${step}`);
    }
}

function stepCandidates(step) {
    const candidates = { '1': [1], '2': [2], '3-5': [3, 4, 5] };
    return candidates[step] || [];
}

/**
 * Picks the number being added or taken away. The step constrains num2 for
 * both operators and for every blank mode: the mode only decides which field
 * is blank. For subtraction num2 is the subtrahend (the smaller operand),
 * while num1 is the larger operand. Candidates stay below the limit so the
 * other operand always has room.
 */
function pickStepValue(step, maxLimit) {
    const candidates = stepCandidates(step).filter((value) => value < maxLimit);
    if (candidates.length === 0) {
        throw new RangeError(`Step ${step} cannot be generated at limit ${maxLimit}`);
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

export function generateAddition(maxLimit, step = 'any') {
    assertGeneratableLimit(maxLimit);
    assertStep(step);

    if (step !== 'any') {
        const num2 = pickStepValue(step, maxLimit);
        const num1 = Math.floor(Math.random() * (maxLimit - num2)) + 1;
        return { num1, num2, answer: num1 + num2 };
    }

    let num1, num2;
    do {
        num1 = Math.floor(Math.random() * maxLimit) + 1;
        num2 = Math.floor(Math.random() * maxLimit) + 1;
    } while (num1 + num2 > maxLimit);
    return { num1, num2, answer: num1 + num2 };
}

export function generateSubtraction(maxLimit, step = 'any') {
    assertGeneratableLimit(maxLimit);
    assertStep(step);

    if (step !== 'any') {
        const num2 = pickStepValue(step, maxLimit);
        const num1 = num2 + 1 + Math.floor(Math.random() * (maxLimit - num2));
        return { num1, num2, answer: num1 - num2 };
    }

    let num1, num2;
    do {
        num1 = Math.floor(Math.random() * maxLimit) + 1;
        num2 = Math.floor(Math.random() * num1);
    } while (num2 === 0 || num1 === 1);
    return { num1, num2, answer: num1 - num2 };
}

/**
 * Randomly decides which field (A, B, or C) is left blank.
 * 0 -> num1, 1 -> num2, 2 -> answer.
 * Legacy path: generateProblem now decides the blank from the mode.
 */
export function pickRandomField() {
    return Math.floor(Math.random() * 3);
}

export const MODES = ['result', 'part', 'start'];

function assertMode(operator, mode) {
    if (!MODES.includes(mode)) {
        throw new RangeError(`Unknown mode: ${mode}`);
    }
    if (operator !== '+' && operator !== '-') {
        throw new RangeError(`Unknown operator: ${operator}`);
    }
    if (mode === 'start' && operator === '+') {
        throw new RangeError('Start-unknown mode is only available for subtraction');
    }
}

function blankFieldFor(operator, mode) {
    if (mode === 'result') return 'answer';
    if (mode === 'part') {
        if (operator === '-') return 'num2';
        return Math.random() < 0.5 ? 'num1' : 'num2';
    }
    return 'num1';
}

/**
 * Builds an item whose blank is chosen by the task mode, never at random.
 * step is a generation parameter and is deliberately not item data.
 */
export function generateProblem(operator, limit, mode = 'result', step = 'any') {
    assertMode(operator, mode);
    assertStep(step);
    const base = operator === '+' ? generateAddition(limit, step) : generateSubtraction(limit, step);
    return {
        num1: base.num1,
        num2: base.num2,
        answer: base.answer,
        operator,
        blankField: blankFieldFor(operator, mode),
        mode
    };
}

/**
 * Pure answer checker.
 * Returns true/false, or null when the input is incomplete/invalid.
 */
export function evaluateAnswer(val1, val2, answerVal, operator) {
    if ([val1, val2, answerVal].some((value) => value == null || String(value).trim() === '') ||
        isNaN(val1) || isNaN(val2) || isNaN(answerVal)) {
        return null;
    }
    if (operator === '+') {
        return val1 + val2 === answerVal;
    }
    return val1 - val2 === answerVal;
}

// --- Test helpers (ported from the original math-game.js) ---

export function testAddition(maxLimit, iterations = 100) {
    const results = [];
    let allPassed = true;
    for (let i = 0; i < iterations; i++) {
        const problem = generateAddition(maxLimit);
        const passed =
            problem.num1 >= 1 && problem.num2 >= 1 &&
            problem.num1 <= maxLimit && problem.num2 <= maxLimit &&
            problem.answer === problem.num1 + problem.num2 &&
            problem.answer <= maxLimit;
        results.push({ num1: problem.num1, num2: problem.num2, answer: problem.answer, passed });
        if (!passed) allPassed = false;
    }
    return { allPassed, results };
}

export function testSubtraction(maxLimit, iterations = 100) {
    const results = [];
    let allPassed = true;
    for (let i = 0; i < iterations; i++) {
        const problem = generateSubtraction(maxLimit);
        const passed =
            problem.num1 >= 2 && problem.num2 >= 1 &&
            problem.num1 <= maxLimit && problem.num2 <= maxLimit &&
            problem.num1 > problem.num2 && problem.answer >= 1;
        results.push({ num1: problem.num1, num2: problem.num2, answer: problem.answer, passed });
        if (!passed) allPassed = false;
    }
    return { allPassed, results };
}

export function testRandomField(iterations = 1000) {
    const fieldCounts = { num1: 0, num2: 0, answer: 0 };
    for (let i = 0; i < iterations; i++) {
        const field = pickRandomField();
        if (field === 0) fieldCounts.num1++;
        else if (field === 1) fieldCounts.num2++;
        else fieldCounts.answer++;
    }
    const expected = iterations / 3;
    const tolerance = expected * 0.2;
    const passed =
        Math.abs(fieldCounts.num1 - expected) < tolerance &&
        Math.abs(fieldCounts.num2 - expected) < tolerance &&
        Math.abs(fieldCounts.answer - expected) < tolerance;
    return { passed, fieldCounts, expected, tolerance };
}