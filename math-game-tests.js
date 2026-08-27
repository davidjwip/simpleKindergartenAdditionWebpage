// Math Game Tests
// Run these tests using Node.js: node math-game-tests.js

const MathGame = require('./math-game.js');

let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✓ ${description}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  ${error.message}`);
        failed++;
    }
}

function assertEqual(actual, expected, msg = '') {
    if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}. ${msg}`);
    }
}

function assertTrue(condition, msg = '') {
    if (!condition) {
        throw new Error(`Expected true, got false. ${msg}`);
    }
}

function assertArrayContains(arr, value, msg = '') {
    if (!arr.includes(value)) {
        throw new Error(`Expected array to contain ${value}. ${msg}`);
    }
}

console.log('\n=== Addition Tests ===\n');

test('generateAddition generates valid addition problems (limit 10)', () => {
    const problem = MathGame.generateAddition(10);
    assertEqual(problem.num1 + problem.num2, problem.answer);
    assertTrue(problem.num1 >= 1 && problem.num1 <= 10);
    assertTrue(problem.num2 >= 1 && problem.num2 <= 10);
    assertTrue(problem.answer <= 10);
});

test('generateAddition generates valid addition problems (limit 20)', () => {
    const problem = MathGame.generateAddition(20);
    assertEqual(problem.num1 + problem.num2, problem.answer);
    assertTrue(problem.num1 >= 1 && problem.num1 <= 20);
    assertTrue(problem.num2 >= 1 && problem.num2 <= 20);
    assertTrue(problem.answer <= 20);
});

test('testAddition passes for limit 10', () => {
    const result = MathGame.testAddition(10, 50);
    assertTrue(result.allPassed, 'All addition problems should be valid');
    assertEqual(result.results.length, 50, 'Should generate 50 test cases');
});

test('testAddition passes for limit 20', () => {
    const result = MathGame.testAddition(20, 50);
    assertTrue(result.allPassed, 'All addition problems should be valid');
    assertEqual(result.results.length, 50, 'Should generate 50 test cases');
});

console.log('\n=== Subtraction Tests ===\n');

test('generateSubtraction generates valid subtraction problems (limit 10)', () => {
    const problem = MathGame.generateSubtraction(10);
    assertEqual(problem.num1 - problem.num2, problem.answer);
    assertTrue(problem.num1 >= 1 && problem.num1 <= 10);
    assertTrue(problem.num2 >= 1 && problem.num2 <= 10);
    assertTrue(problem.num1 >= problem.num2, 'num1 should be >= num2 for positive result');
    assertTrue(problem.answer >= 0, 'Answer should be non-negative');
});

test('generateSubtraction generates valid subtraction problems (limit 20)', () => {
    const problem = MathGame.generateSubtraction(20);
    assertEqual(problem.num1 - problem.num2, problem.answer);
    assertTrue(problem.num1 >= 1 && problem.num1 <= 20);
    assertTrue(problem.num2 >= 1 && problem.num2 <= 20);
    assertTrue(problem.num1 >= problem.num2);
    assertTrue(problem.answer >= 0);
});

test('testSubtraction passes for limit 10', () => {
    const result = MathGame.testSubtraction(10, 50);
    assertTrue(result.allPassed, 'All subtraction problems should be valid');
    assertEqual(result.results.length, 50, 'Should generate 50 test cases');
});

test('testSubtraction passes for limit 20', () => {
    const result = MathGame.testSubtraction(20, 50);
    assertTrue(result.allPassed, 'All subtraction problems should be valid');
    assertEqual(result.results.length, 50, 'Should generate 50 test cases');
});

console.log('\n=== Random Field Selection Tests ===\n');

test('testRandomField shows uniform distribution', () => {
    const result = MathGame.testRandomField(1000);
    assertTrue(result.passed, 'Field distribution should be within 20% of expected');
    assertEqual(result.fieldCounts.num1 + result.fieldCounts.num2 + result.fieldCounts.answer, 1000, 'Total should equal iterations');
});

console.log('\n=== Integration Tests ===\n');

test('CheckAnswer returns correct result for addition', () => {
    // Simulate a problem: 3 + 5 = 8
    const domElements = {
        num1Input: { value: '3' },
        num2Input: { value: '5' },
        answerInput: { value: '8' },
        feedbackDiv: { textContent: '', style: { color: '' } },
        touchpad: { innerHTML: '' },
        limitToggle: { checked: false, addEventListener: () => {} },
        problemsSolvedSpan: { textContent: '' },
        totalProblemsSpan: { textContent: '' },
        progressFill: { style: { width: '' } }
    };
    
    MathGame.init(domElements);
    
    const initialProblemsSolved = MathGame.getProblemsSolved();
    MathGame.generateNewProblem();
    
    const savedCorrectAnswer = 8;
    domElements.answerInput.value = '8';
    MathGame.checkAnswer();
    
    assertEqual(domElements.feedbackDiv.textContent, 'Correct! 🎉', 'Should show correct feedback');
});

test('CheckAnswer returns incorrect result for wrong answer', () => {
    const domElements = {
        num1Input: { value: '' },
        num2Input: { value: '' },
        answerInput: { value: '0' },
        feedbackDiv: { textContent: '', style: { color: '' } },
        touchpad: { innerHTML: '' },
        limitToggle: { checked: false, addEventListener: () => {} },
        problemsSolvedSpan: { textContent: '' },
        totalProblemsSpan: { textContent: '' },
        progressFill: { style: { width: '' } }
    };
    
    MathGame.init(domElements);
    MathGame.generateNewProblem();
    
    const initialProblemsSolved = MathGame.getProblemsSolved();
    domElements.answerInput.value = '0';
    MathGame.checkAnswer();
    
    assertEqual(domElements.feedbackDiv.textContent, 'Incorrect 😊', 'Should show incorrect feedback');
});

console.log('\n' + '='.repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
}
