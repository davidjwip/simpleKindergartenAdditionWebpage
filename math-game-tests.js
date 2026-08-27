// Math Game Tests
// Run these tests using Node.js: node math-game-tests.js

const MathGame = require('./math-game.js');

let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`\u2713 ${description}`);
        passed++;
    } catch (error) {
        console.log(`\u2717 ${description}`);
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

function assertFalse(condition, msg = '') {
    if (condition) {
        throw new Error(`Expected false, got true. ${msg}`);
    }
}

function assertNull(value, msg = '') {
    if (value !== null) {
        throw new Error(`Expected null, got ${value}. ${msg}`);
    }
}

// ---------------------------------------------------------------------------
// Mock DOM helpers
// ---------------------------------------------------------------------------

// Minimal fake timer implementation so we can control setTimeout deterministically.
const fakeTimers = {
    pending: [],
    nextId: 1,
    install() {
        this.pending = [];
        this.nextId = 1;
        global.setTimeout = (fn, delay) => {
            const id = this.nextId++;
            this.pending.push({ id, fn });
            return id;
        };
        global.clearTimeout = (id) => {
            this.pending = this.pending.filter((t) => t.id !== id);
        };
    },
    count() {
        return this.pending.length;
    },
    flush() {
        // Run all currently-queued timers (does not run timers queued during flush).
        const toRun = this.pending.slice();
        this.pending = [];
        toRun.forEach((t) => t.fn());
    }
};

function makeInput(value = '') {
    // Real DOM inputs always coerce .value to a string; mirror that here.
    let internal = String(value);
    return {
        _isInput: true,
        get value() { return internal; },
        set value(v) { internal = String(v); }
    };
}

function makeClassList() {
    const set = new Set();
    return {
        add: (c) => set.add(c),
        remove: (c) => set.delete(c),
        toggle: (c, force) => {
            if (force === undefined) {
                if (set.has(c)) set.delete(c);
                else set.add(c);
            } else if (force) {
                set.add(c);
            } else {
                set.delete(c);
            }
        },
        contains: (c) => set.has(c)
    };
}

// A very small fake touchpad element that records appended children and lets
// us "click" a numbered button by its value.
function makeTouchpad() {
    const children = [];
    return {
        children,
        firstChild: null,
        appendChild(node) {
            children.push(node);
            this.firstChild = children[0];
        },
        removeChild(node) {
            const idx = children.indexOf(node);
            if (idx !== -1) children.splice(idx, 1);
            this.firstChild = children.length ? children[0] : null;
        },
        clickNumber(n) {
            const btn = children.find((c) => String(c.textContent) === String(n));
            if (!btn) throw new Error(`No touchpad button for ${n}`);
            btn.onclick.call(btn);
        }
    };
}

// Install a fake `document` so initTouchpad can create buttons.
function installFakeDocument() {
    global.document = {
        createElement() {
            return {
                className: '',
                textContent: '',
                _attrs: {},
                classList: makeClassList(),
                setAttribute(name, val) {
                    this._attrs[name] = String(val);
                },
                getAttribute(name) {
                    return this._attrs[name];
                },
                onclick: null
            };
        }
    };
}

function makeDom(overrides = {}) {
    return Object.assign({
        num1Input: makeInput(''),
        num2Input: makeInput(''),
        answerInput: makeInput(''),
        feedbackDiv: { textContent: '', style: { color: '' } },
        touchpad: makeTouchpad(),
        limitToggle: { checked: false, addEventListener: () => {} },
        problemsSolvedSpan: { textContent: '' },
        totalProblemsSpan: { textContent: '' },
        progressFill: { style: { width: '' } },
        operatorSpan: { textContent: '+' },
        addBtn: { classList: makeClassList() },
        subtractBtn: { classList: makeClassList() }
    }, overrides);
}

// Fully (re)initialize the game to a known state for a test.
function setupGame(overrides = {}) {
    installFakeDocument();
    fakeTimers.install();
    const dom = makeDom(overrides);
    MathGame.init(dom);
    MathGame.setOperator('+', dom.operatorSpan);
    return dom;
}

// ---------------------------------------------------------------------------
// Pure generator tests
// ---------------------------------------------------------------------------

console.log('\n=== Addition Generation ===\n');

test('generateAddition: sum equals answer (limit 10)', () => {
    for (let i = 0; i < 200; i++) {
        const p = MathGame.generateAddition(10);
        assertEqual(p.num1 + p.num2, p.answer);
    }
});

test('generateAddition: operands and answer within limit 10', () => {
    for (let i = 0; i < 200; i++) {
        const p = MathGame.generateAddition(10);
        assertTrue(p.num1 >= 1 && p.num1 <= 10, `num1=${p.num1}`);
        assertTrue(p.num2 >= 1 && p.num2 <= 10, `num2=${p.num2}`);
        assertTrue(p.answer <= 10, `answer=${p.answer}`);
    }
});

test('generateAddition: answer within limit 20', () => {
    for (let i = 0; i < 200; i++) {
        const p = MathGame.generateAddition(20);
        assertTrue(p.answer <= 20, `answer=${p.answer}`);
    }
});

test('testAddition helper reports all passed (limit 10 and 20)', () => {
    assertTrue(MathGame.testAddition(10, 100).allPassed);
    assertTrue(MathGame.testAddition(20, 100).allPassed);
});

console.log('\n=== Subtraction Generation ===\n');

test('generateSubtraction: difference equals answer', () => {
    for (let i = 0; i < 200; i++) {
        const p = MathGame.generateSubtraction(10);
        assertEqual(p.num1 - p.num2, p.answer);
    }
});

test('generateSubtraction: never produces a negative answer', () => {
    for (let i = 0; i < 500; i++) {
        const p = MathGame.generateSubtraction(20);
        assertTrue(p.answer >= 0, `answer=${p.answer}`);
        assertTrue(p.num1 >= p.num2, `num1=${p.num1} num2=${p.num2}`);
    }
});

test('generateSubtraction: operands within limit', () => {
    for (let i = 0; i < 200; i++) {
        const p = MathGame.generateSubtraction(10);
        assertTrue(p.num1 >= 1 && p.num1 <= 10, `num1=${p.num1}`);
        assertTrue(p.num2 >= 1 && p.num2 <= 10, `num2=${p.num2}`);
    }
});

test('testSubtraction helper reports all passed (limit 10 and 20)', () => {
    assertTrue(MathGame.testSubtraction(10, 100).allPassed);
    assertTrue(MathGame.testSubtraction(20, 100).allPassed);
});

console.log('\n=== Random Field Selection ===\n');

test('testRandomField: uniform distribution within tolerance', () => {
    const result = MathGame.testRandomField(3000);
    assertTrue(result.passed, 'Distribution should be within 20% of expected');
    assertEqual(
        result.fieldCounts.num1 + result.fieldCounts.num2 + result.fieldCounts.answer,
        3000
    );
});

// ---------------------------------------------------------------------------
// evaluateAnswer (pure answer-checking logic)
// ---------------------------------------------------------------------------

console.log('\n=== evaluateAnswer ===\n');

test('evaluateAnswer: correct addition', () => {
    assertTrue(MathGame.evaluateAnswer(3, 5, 8, '+'));
});

test('evaluateAnswer: incorrect addition', () => {
    assertFalse(MathGame.evaluateAnswer(3, 5, 9, '+'));
});

test('evaluateAnswer: correct subtraction', () => {
    assertTrue(MathGame.evaluateAnswer(9, 4, 5, '-'));
});

test('evaluateAnswer: incorrect subtraction', () => {
    assertFalse(MathGame.evaluateAnswer(9, 4, 6, '-'));
});

test('evaluateAnswer: missing operand returns null', () => {
    assertNull(MathGame.evaluateAnswer(NaN, 5, 8, '+'));
    assertNull(MathGame.evaluateAnswer(3, NaN, 8, '+'));
    assertNull(MathGame.evaluateAnswer(3, 5, NaN, '+'));
});

test('evaluateAnswer: zero is a valid answer, not treated as missing', () => {
    assertTrue(MathGame.evaluateAnswer(5, 5, 0, '-'));
});

// ---------------------------------------------------------------------------
// checkAnswer integration (feedback + scoring)
// ---------------------------------------------------------------------------

console.log('\n=== checkAnswer Integration ===\n');

test('checkAnswer: addition with missing first operand marked correct', () => {
    const dom = setupGame();
    // Problem: _ + 3 = 8, user fills 5
    dom.num1Input.value = '5';
    dom.num2Input.value = '3';
    dom.answerInput.value = '8';
    MathGame.checkAnswer();
    assertEqual(dom.feedbackDiv.textContent, 'Correct! \ud83c\udf89');
});

test('checkAnswer: addition wrong answer marked incorrect', () => {
    const dom = setupGame();
    dom.num1Input.value = '5';
    dom.num2Input.value = '3';
    dom.answerInput.value = '9';
    MathGame.checkAnswer();
    assertEqual(dom.feedbackDiv.textContent, 'Incorrect \ud83d\ude0a');
});

test('checkAnswer: subtraction correct', () => {
    const dom = setupGame();
    MathGame.setOperator('-', dom.operatorSpan);
    dom.num1Input.value = '9';
    dom.num2Input.value = '4';
    dom.answerInput.value = '5';
    MathGame.checkAnswer();
    assertEqual(dom.feedbackDiv.textContent, 'Correct! \ud83c\udf89');
});

test('checkAnswer: empty field prompts to fill in', () => {
    const dom = setupGame();
    dom.num1Input.value = '5';
    dom.num2Input.value = '';
    dom.answerInput.value = '8';
    MathGame.checkAnswer();
    assertEqual(dom.feedbackDiv.textContent, 'Please fill in all fields!');
});

test('checkAnswer: correct answer increments problemsSolved and totalProblems', () => {
    const dom = setupGame();
    const solvedBefore = MathGame.getProblemsSolved();
    const totalBefore = MathGame.getTotalProblems();
    dom.num1Input.value = '2';
    dom.num2Input.value = '3';
    dom.answerInput.value = '5';
    MathGame.checkAnswer();
    assertEqual(MathGame.getProblemsSolved(), solvedBefore + 1);
    assertEqual(MathGame.getTotalProblems(), totalBefore + 1);
});

test('checkAnswer: incorrect answer increments only totalProblems', () => {
    const dom = setupGame();
    const solvedBefore = MathGame.getProblemsSolved();
    const totalBefore = MathGame.getTotalProblems();
    dom.num1Input.value = '2';
    dom.num2Input.value = '3';
    dom.answerInput.value = '6';
    MathGame.checkAnswer();
    assertEqual(MathGame.getProblemsSolved(), solvedBefore);
    assertEqual(MathGame.getTotalProblems(), totalBefore + 1);
});

test('checkAnswer: empty field does not change score', () => {
    const dom = setupGame();
    const solvedBefore = MathGame.getProblemsSolved();
    const totalBefore = MathGame.getTotalProblems();
    dom.num1Input.value = '2';
    dom.num2Input.value = '';
    dom.answerInput.value = '5';
    MathGame.checkAnswer();
    assertEqual(MathGame.getProblemsSolved(), solvedBefore);
    assertEqual(MathGame.getTotalProblems(), totalBefore);
});

// ---------------------------------------------------------------------------
// Timer / crash-regression tests
// These reproduce the mobile crash: rapid clicks queuing many timers, or a
// timer firing generateNewProblem while another call is already in progress.
// ---------------------------------------------------------------------------

console.log('\n=== Timer Behaviour (crash regression) ===\n');

test('correct answer schedules exactly one timer', () => {
    const dom = setupGame();
    dom.num1Input.value = '2';
    dom.num2Input.value = '3';
    dom.answerInput.value = '5';
    MathGame.checkAnswer();
    assertEqual(fakeTimers.count(), 1, 'Exactly one pending timer expected');
});

test('incorrect answer schedules exactly one timer', () => {
    const dom = setupGame();
    dom.num1Input.value = '2';
    dom.num2Input.value = '3';
    dom.answerInput.value = '9';
    MathGame.checkAnswer();
    assertEqual(fakeTimers.count(), 1, 'Exactly one pending timer expected');
});

test('repeated checkAnswer never accumulates more than one timer', () => {
    const dom = setupGame();
    for (let i = 0; i < 20; i++) {
        // Alternate correct/incorrect to exercise both branches.
        dom.num1Input.value = '2';
        dom.num2Input.value = '3';
        dom.answerInput.value = (i % 2 === 0) ? '5' : '9';
        MathGame.checkAnswer();
        assertTrue(fakeTimers.count() <= 1, `Timer leak at iteration ${i}: ${fakeTimers.count()}`);
    }
});

test('firing the auto-advance timer produces a fresh valid problem', () => {
    const dom = setupGame();
    dom.num1Input.value = '2';
    dom.num2Input.value = '3';
    dom.answerInput.value = '5';
    MathGame.checkAnswer();
    assertEqual(fakeTimers.count(), 1);
    fakeTimers.flush();
    // After advancing, exactly one field should be blank and the rest filled.
    const blanks = [dom.num1Input.value, dom.num2Input.value, dom.answerInput.value]
        .filter((v) => v === '').length;
    assertEqual(blanks, 1, 'Exactly one field should be empty in a new problem');
    assertEqual(fakeTimers.count(), 0, 'No leftover timers after advancing');
});

test('generateNewProblem re-entrancy guard prevents nested runs', () => {
    const dom = setupGame();
    // Manually invoke many times in a tight loop; should never throw or leak.
    for (let i = 0; i < 100; i++) {
        MathGame.generateNewProblem();
    }
    assertEqual(fakeTimers.count(), 0, 'generateNewProblem should not queue timers');
});

test('toggling operator many times does not leak timers or change score', () => {
    const dom = setupGame();
    const totalBefore = MathGame.getTotalProblems();
    for (let i = 0; i < 30; i++) {
        MathGame.setOperator(i % 2 === 0 ? '-' : '+', dom.operatorSpan);
    }
    assertEqual(fakeTimers.count(), 0, 'Operator toggling should not queue timers');
    assertEqual(MathGame.getTotalProblems(), totalBefore, 'Toggling should not change score');
});

// ---------------------------------------------------------------------------
// generateNewProblem: generated problem is internally consistent
// ---------------------------------------------------------------------------

console.log('\n=== generateNewProblem Consistency ===\n');

test('generated addition problem is always solvable and consistent', () => {
    const dom = setupGame();
    for (let i = 0; i < 100; i++) {
        MathGame.generateNewProblem();
        const a = dom.num1Input.value;
        const b = dom.num2Input.value;
        const c = dom.answerInput.value;
        const blanks = [a, b, c].filter((v) => v === '').length;
        assertEqual(blanks, 1, `Exactly one blank expected, got ${blanks}`);
        // Fill the blank with the correct value and confirm checkAnswer accepts it.
        if (a === '') dom.num1Input.value = String(Number(c) - Number(b));
        else if (b === '') dom.num2Input.value = String(Number(c) - Number(a));
        else dom.answerInput.value = String(Number(a) + Number(b));
        MathGame.checkAnswer();
        assertEqual(dom.feedbackDiv.textContent, 'Correct! \ud83c\udf89', `Iteration ${i}`);
        fakeTimers.flush(); // advance to next problem
    }
});

test('generated subtraction problem is always solvable and consistent', () => {
    const dom = setupGame();
    MathGame.setOperator('-', dom.operatorSpan);
    for (let i = 0; i < 100; i++) {
        const a = dom.num1Input.value;
        const b = dom.num2Input.value;
        const c = dom.answerInput.value;
        const blanks = [a, b, c].filter((v) => v === '').length;
        assertEqual(blanks, 1, `Exactly one blank expected, got ${blanks}`);
        if (a === '') dom.num1Input.value = String(Number(c) + Number(b));
        else if (b === '') dom.num2Input.value = String(Number(a) - Number(c));
        else dom.answerInput.value = String(Number(a) - Number(b));
        MathGame.checkAnswer();
        assertEqual(dom.feedbackDiv.textContent, 'Correct! \ud83c\udf89', `Iteration ${i}`);
        fakeTimers.flush();
    }
});

// ---------------------------------------------------------------------------
// Touchpad interaction
// ---------------------------------------------------------------------------

console.log('\n=== Touchpad ===\n');

test('touchpad renders one button per number up to the limit', () => {
    const dom = setupGame();
    assertEqual(dom.touchpad.children.length, MathGame.getMaxLimit());
});

test('touchpad fills the first empty field then checks', () => {
    const dom = setupGame();
    MathGame.generateNewProblem();
    // Force a known problem shape: blank first operand.
    dom.num1Input.value = '';
    dom.num2Input.value = '3';
    dom.answerInput.value = '8';
    dom.touchpad.clickNumber(5); // 5 + 3 = 8
    assertEqual(dom.num1Input.value, '5');
    assertEqual(dom.feedbackDiv.textContent, 'Correct! \ud83c\udf89');
});

// ---------------------------------------------------------------------------
// setMaxLimit
// ---------------------------------------------------------------------------

console.log('\n=== setMaxLimit ===\n');

test('setMaxLimit updates limit and rebuilds touchpad', () => {
    const dom = setupGame();
    MathGame.setMaxLimit(20);
    assertEqual(MathGame.getMaxLimit(), 20);
    assertEqual(dom.touchpad.children.length, 20);
    MathGame.setMaxLimit(10);
    assertEqual(MathGame.getMaxLimit(), 10);
    assertEqual(dom.touchpad.children.length, 10);
});

// ---------------------------------------------------------------------------
// Celebration threshold (regression: overlay never fired because the old
// monkey-patched MathGame.updateProgress was never called internally)
// ---------------------------------------------------------------------------

console.log('\n=== Celebration Threshold ===\n');

test('progress callback reports solved count reaching 10', () => {
    const dom = setupGame();
    MathGame.resetSolvedCount();
    const seen = [];
    MathGame.setProgressCallback((solved) => seen.push(solved));
    for (let i = 0; i < 10; i++) {
        dom.num1Input.value = '2';
        dom.num2Input.value = '3';
        dom.answerInput.value = '5';
        MathGame.checkAnswer();
        fakeTimers.flush();
    }
    assertEqual(MathGame.getProblemsSolved(), 10);
    assertTrue(seen.includes(10), `Expected callback to receive 10, got ${JSON.stringify(seen)}`);
});

test('celebration shows exactly once at 10 and re-arms after reset', () => {
    const dom = setupGame();
    MathGame.resetProgress();
    let celebrationShown = false;
    let shownCount = 0;
    MathGame.setProgressCallback((solved) => {
        if (solved >= 10 && !celebrationShown) {
            celebrationShown = true;
            shownCount++;
        }
    });
    // Solve 25 problems; "close" (reset) on the 10th and 20th solves.
    for (let i = 0; i < 25; i++) {
        dom.num1Input.value = '2';
        dom.num2Input.value = '3';
        dom.answerInput.value = '5';
        MathGame.checkAnswer();
        fakeTimers.flush();
        if (MathGame.getProblemsSolved() >= 10 && celebrationShown) {
            MathGame.resetProgress();
            celebrationShown = false;
        }
    }
    assertEqual(shownCount, 2, 'Should have celebrated twice (at 10 and 20)');
});

// ---------------------------------------------------------------------------
// Total-attempt tracking / reset (regression: totalProblems was never cleared
// when a new round started, so it showed the stale value, e.g. 10, instead of 0)
// ---------------------------------------------------------------------------

console.log('\n=== Total Attempts & Reset ===\n');

test('after resetProgress both counts are zero', () => {
    const dom = setupGame();
    MathGame.resetProgress(); // clear any state carried over from earlier tests
    // Fake some prior activity so the counters are non-zero.
    dom.num1Input.value = '2';
    dom.num2Input.value = '3';
    dom.answerInput.value = '5';
    MathGame.checkAnswer();
    dom.answerInput.value = '9';
    MathGame.checkAnswer();
    assertEqual(MathGame.getTotalProblems(), 2);
    assertEqual(MathGame.getProblemsSolved(), 1);

    MathGame.resetProgress();
    assertEqual(MathGame.getProblemsSolved(), 0, 'Problems solved should reset to 0');
    assertEqual(MathGame.getTotalProblems(), 0, 'Total attempts should reset to 0');
});

test('total counts both correct and incorrect attempts from zero', () => {
    const dom = setupGame();
    MathGame.resetProgress();
    assertEqual(MathGame.getTotalProblems(), 0, 'Total should start at 0');

    for (let i = 0; i < 5; i++) {
        MathGame.generateNewProblem();
        dom.num1Input.value = '2';
        dom.num2Input.value = '3';
        dom.answerInput.value = '5';
        MathGame.checkAnswer();   // correct
        fakeTimers.flush();
    }
    for (let i = 0; i < 5; i++) {
        MathGame.generateNewProblem();
        dom.num1Input.value = '2';
        dom.num2Input.value = '3';
        dom.answerInput.value = '9';
        MathGame.checkAnswer();   // incorrect
        fakeTimers.flush();
    }
    // 5 correct + 5 incorrect = 10 attempts, only 5 solved.
    assertEqual(MathGame.getProblemsSolved(), 5);
    assertEqual(MathGame.getTotalProblems(), 10);
});

test('generating a new problem does not alter the attempt counter', () => {
    const dom = setupGame();
    MathGame.resetProgress();
    MathGame.generateNewProblem();
    MathGame.generateNewProblem();
    assertEqual(MathGame.getTotalProblems(), 0, 'generateNewProblem must not count attempts');
    assertEqual(MathGame.getProblemsSolved(), 0);
});

// ---------------------------------------------------------------------------

console.log('\n' + '='.repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
}
