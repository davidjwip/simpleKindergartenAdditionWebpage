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

export function generateAddition(maxLimit) {
    let num1, num2;
    do {
        num1 = Math.floor(Math.random() * maxLimit) + 1;
        num2 = Math.floor(Math.random() * maxLimit) + 1;
    } while (num1 + num2 > maxLimit);
    return { num1, num2, answer: num1 + num2 };
}

export function generateSubtraction(maxLimit) {
    const num1 = Math.floor(Math.random() * maxLimit) + 1;
    const num2 = Math.floor(Math.random() * num1);
    return { num1, num2, answer: num1 - num2 };
}

/**
 * Randomly decides which field (A, B, or C) is left blank.
 * 0 -> num1, 1 -> num2, 2 -> answer.
 */
export function pickRandomField() {
    return Math.floor(Math.random() * 3);
}

/**
 * Pure answer checker.
 * Returns true/false, or null when the input is incomplete/invalid.
 */
export function evaluateAnswer(val1, val2, answerVal, operator) {
    if (isNaN(val1) || isNaN(val2) || isNaN(answerVal)) {
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
            problem.num1 >= 1 && problem.num2 >= 0 &&
            problem.num1 <= maxLimit && problem.num2 <= maxLimit &&
            problem.num1 >= problem.num2 && problem.answer >= 1;
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