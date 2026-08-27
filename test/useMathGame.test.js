// useMathGame.test.js — port of the original node test suite for the game
// logic, now targeting the reactive composable. Uses Vitest fake timers so the
// timer crash-regression behaviors are fully testable without a browser.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMathGame } from '../src/useMathGame';
import { evaluateAnswer } from '../src/mathEngine';

const AUTO_ADVANCE = 2000;
const INCORRECT_RETRY = 1500;

let game;

function makeAdd() {
    // A correct addition "2 + 3 = 5".
    game.num1.value = '2';
    game.num2.value = '3';
    game.answer.value = '5';
    game.checkAnswer();
}

function makeSubtract() {
    // A correct subtraction "5 - 3 = 2".
    game.num1.value = '5';
    game.num2.value = '3';
    game.answer.value = '2';
    game.checkAnswer();
}

function makeIncorrect() {
    game.num1.value = '2';
    game.num2.value = '3';
    game.answer.value = '9';
    game.checkAnswer();
}

beforeEach(() => {
    vi.useFakeTimers();
    game = useMathGame();
    game.setOperator('+');
    game.resetProgress();
});

afterEach(() => {
    vi.useRealTimers();
});

// The displayed fields should (re)compose into a correct equation with exactly
// one blank. When a blank is present, reconstruct it from the two given values.
function expectTripleValid() {
    const op = game.operator.value;
    let a = Number(game.num1.value);
    let b = Number(game.num2.value);
    let c = Number(game.answer.value);
    const emptyCount = [game.num1.value, game.num2.value, game.answer.value].filter((v) => v === '').length;

    if (game.num1.value === '') a = op === '+' ? c - b : c + b;
    if (game.num2.value === '') b = op === '+' ? c - a : a - c;
    if (game.answer.value === '') c = op === '+' ? a + b : a - b;

    expect(emptyCount).toBe(1);
    expect(evaluateAnswer(a, b, c, op)).toBe(true);
}

describe('generated problem consistency', () => {
    it('every generated problem is solvable once the blank is deduced', () => {
        for (let i = 0; i < 200; i++) {
            game.generateNewProblem();
            expectTripleValid();
        }
    });
});

describe('timer behavior (crash regression)', () => {
    it('queues exactly one timer after a correct answer', () => {
        game.generateNewProblem();
        makeAdd();
        expect(vi.getTimerCount()).toBe(1);
    });

    it('does not accumulate multiple timers on rapid correct interactions', () => {
        game.generateNewProblem();
        makeAdd();
        makeAdd();
        expect(vi.getTimerCount()).toBe(1);
    });

    it('auto-advances to a valid new problem after the delay', () => {
        game.generateNewProblem();
        makeAdd();
        vi.advanceTimersByTime(AUTO_ADVANCE);
        expect(vi.getTimerCount()).toBe(0);
        expectTripleValid();
    });

    it('keeps the solved count stable across an auto-advance', () => {
        game.generateNewProblem();
        makeAdd();
        expect(game.problemsSolved.value).toBe(1);
        vi.advanceTimersByTime(AUTO_ADVANCE);
        expect(game.problemsSolved.value).toBe(1);
        expectTripleValid();
    });
it('schedules a regeneration after an incorrect answer', () => {
        game.generateNewProblem();
        makeIncorrect();
        expect(vi.getTimerCount()).toBe(1);
        vi.advanceTimersByTime(INCORRECT_RETRY);
        expectTripleValid();
    });

    it('clears the pending correct-answer timer when answering again', () => {
        game.generateNewProblem();
        makeAdd();
        vi.advanceTimersByTime(AUTO_ADVANCE - 100);
        makeIncorrect(); // should clear the pending auto-advance timer first
        expect(vi.getTimerCount()).toBe(1); // only the fresh incorrect-retry timer remains
    });
});

describe('progress & reset', () => {
    it('resetProgress clears both counters', () => {
        game.generateNewProblem();
        makeAdd();
        makeIncorrect();
        expect(game.problemsSolved.value).toBe(1);
        expect(game.totalProblems.value).toBe(2);
        game.resetProgress();
        expect(game.problemsSolved.value).toBe(0);
        expect(game.totalProblems.value).toBe(0);
        expect(game.progressPercent.value).toBe(0);
    });

    it('counts correct and incorrect attempts from zero', () => {
        for (let i = 0; i < 5; i++) {
            game.generateNewProblem();
            makeAdd();
            vi.advanceTimersByTime(AUTO_ADVANCE);
        }
        for (let i = 0; i < 5; i++) {
            game.generateNewProblem();
            makeIncorrect();
            vi.advanceTimersByTime(INCORRECT_RETRY);
        }
        expect(game.problemsSolved.value).toBe(5);
        expect(game.totalProblems.value).toBe(10);
        expect(game.progressPercent.value).toBe(50);
    });

    it('generating a new problem does not affect the counters', () => {
        game.generateNewProblem();
        game.generateNewProblem();
        expect(game.totalProblems.value).toBe(0);
        expect(game.problemsSolved.value).toBe(0);
    });

    it('an incorrect attempt increases total but not solved', () => {
        game.generateNewProblem();
        makeIncorrect();
        expect(game.totalProblems.value).toBe(1);
        expect(game.problemsSolved.value).toBe(0);
        expect(game.progressPercent.value).toBe(0);
    });
});

describe('celebrate once per ten solved', () => {
    it('fires the progress callback once at 10 and re-arms after reset', () => {
        let shownCount = 0;
        let armed = true;
        game.setProgressCallback((solved) => {
            if (solved >= 10 && armed) {
                armed = false;
                shownCount++;
            }
        });
        for (let i = 0; i < 25; i++) {
            game.generateNewProblem();
            makeAdd();
            vi.advanceTimersByTime(AUTO_ADVANCE);
            if (game.problemsSolved.value >= 10 && !armed) {
                game.resetProgress();
                armed = true;
            }
        }
        expect(shownCount).toBe(2);
    });

    it('operator toggling regenerates the problem without changing counters', () => {
        game.generateNewProblem();
        const opBefore = game.operator.value;
        game.setOperator(opBefore === '+' ? '-' : '+');
        expect(game.problemsSolved.value).toBe(0);
        expect(game.totalProblems.value).toBe(0);
    });
});

describe('subsequent operator correctness', () => {
    it('subtraction mode evaluates with the correct sign', () => {
        game.setOperator('-');
        makeSubtract();
        expect(game.problemsSolved.value).toBe(1);
    });
});