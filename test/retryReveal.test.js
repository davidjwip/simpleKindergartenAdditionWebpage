// retryReveal.test.js — the wrong-answer contract: hold, one retry, reveal.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMathGame, ENCOURAGEMENT_MESSAGES } from '../src/useMathGame';

const HOLD_DELAY = 1500;
const REVEAL_DELAY = 2500;
const AUTO_ADVANCE = 2000;

const BLANK_FIELDS = ['num1', 'num2', 'answer'];

let game;

function fields() {
    return [game.num1.value, game.num2.value, game.answer.value];
}

function blankIndex() {
    return fields().findIndex((value) => value === '');
}

function fullSolution() {
    const op = game.operator.value;
    const blank = blankIndex();
    let a = Number(game.num1.value);
    let b = Number(game.num2.value);
    let c = Number(game.answer.value);

    if (blank === 0) a = op === '+' ? c - b : c + b;
    if (blank === 1) b = op === '+' ? c - a : a - c;
    if (blank === 2) c = op === '+' ? a + b : a - b;

    return { a, b, c, blank };
}

function wrongFor(correct) {
    return correct === 1 ? 2 : 1;
}

function valueFor(solution) {
    return solution.blank === 0 ? solution.a : solution.blank === 1 ? solution.b : solution.c;
}

function wrongForSolution(solution) {
    return wrongFor(valueFor(solution));
}

function generateWithBlank(predicate) {
    for (let i = 0; i < 200; i++) {
        game.generateNewProblem();
        if (predicate(blankIndex())) return fullSolution();
    }
    throw new Error('could not generate the requested blank position');
}

function getToReveal() {
    const solution = fullSolution();
    game.fillValue(wrongForSolution(solution));
    vi.advanceTimersByTime(HOLD_DELAY);
    game.fillValue(wrongForSolution(solution));
    return solution;
}

beforeEach(() => {
    vi.useFakeTimers();
    game = useMathGame();
    game.setOperator('+');
    game.setMode('part');
    game.resetProgress();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('wrong answer hold and retry', () => {
    it('holds the same printed equation for 1.5 s, then re-arms one retry', () => {
        game.generateNewProblem();
        const solution = fullSolution();
        const before = fields();
        const wrong = wrongForSolution(solution);

        game.fillValue(wrong);
        expect(game.isLocked.value).toBe(true);

        vi.advanceTimersByTime(HOLD_DELAY - 1);
        expect(game.isLocked.value).toBe(true);
        expect(fields()).toEqual(before.map((value) => (value === '' ? String(wrong) : value)));

        vi.advanceTimersByTime(1);
        expect(game.isLocked.value).toBe(false);
        expect(fields().filter((value) => value === '')).toHaveLength(1);
        expect(blankIndex()).toBe(solution.blank);
        expect(fields().filter((value, index) => index !== solution.blank)).toEqual(
            before.filter((value, index) => index !== solution.blank)
        );
    });

    it('scores a correct retry as solved and schedules the normal advance', () => {
        game.generateNewProblem();
        const solution = fullSolution();

        game.fillValue(wrongForSolution(solution));
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(valueFor(solution));

        expect(game.problemsSolved.value).toBe(1);
        expect(game.lastResult.value).toBe('correct');
        expect(vi.getTimerCount()).toBe(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'correct', firstTry: false });

        vi.advanceTimersByTime(AUTO_ADVANCE);
        expect(fields().filter((value) => value === '')).toHaveLength(1);
    });

    it('clears the wrong-answer message and result when the retry re-arms', () => {
        game.generateNewProblem();
        const solution = fullSolution();

        game.fillValue(wrongForSolution(solution));
        expect(game.feedback.value).not.toBe('');
        expect(game.lastResult.value).toBe('incorrect');

        vi.advanceTimersByTime(HOLD_DELAY);

        expect(game.feedback.value).toBe('');
        expect(game.lastResult.value).toBe('');
    });

    it('re-fills the original blank field and never overwrites another field', () => {
        const solution = generateWithBlank((blank) => blank !== 2);
        const before = fields();

        game.fillValue(wrongForSolution(solution));
        vi.advanceTimersByTime(HOLD_DELAY);
        expect(fields()[solution.blank]).toBe('');

        game.fillValue(valueFor(solution));

        expect(fields()[solution.blank]).toBe(String(valueFor(solution)));
        expect(fields().filter((value, index) => index !== solution.blank)).toEqual(
            before.filter((value, index) => index !== solution.blank)
        );
    });
});

describe('item accounting across a retry', () => {
    it('counts one item when a wrong first try is corrected on retry', () => {
        game.generateNewProblem();
        const solution = fullSolution();

        game.fillValue(wrongForSolution(solution));
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(valueFor(solution));

        expect(game.problemsSolved.value).toBe(1);
        expect(game.totalProblems.value).toBe(1);
    });

    it('counts one item when both the first try and the retry are wrong', () => {
        game.generateNewProblem();
        const solution = fullSolution();

        game.fillValue(wrongForSolution(solution));
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrongForSolution(solution));

        expect(game.problemsSolved.value).toBe(0);
        expect(game.totalProblems.value).toBe(1);
    });
});

describe('encouragement copy', () => {
    it('never promises a retry the app will not honour', () => {
        expect(ENCOURAGEMENT_MESSAGES.length).toBeGreaterThan(0);
        for (const message of ENCOURAGEMENT_MESSAGES) {
            expect(message).not.toMatch(/try again/i);
            expect(message).not.toMatch(/another go/i);
        }
    });
});

describe('wrong retry reveal', () => {
    it('shows the completed equation, logs the item missed, and advances without scoring', () => {
        game.generateNewProblem();
        const solution = getToReveal();

        expect(game.problemsSolved.value).toBe(0);
        expect(game.isRevealing.value).toBe(true);
        expect(game.blankField.value).toBe(BLANK_FIELDS[solution.blank]);
        expect(fields()).toEqual([String(solution.a), String(solution.b), String(solution.c)]);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'missed', firstTry: false });
        expect(vi.getTimerCount()).toBe(1);

        vi.advanceTimersByTime(REVEAL_DELAY);

        expect(game.isRevealing.value).toBe(false);
        expect(game.problemsSolved.value).toBe(0);
        expect(fields().filter((value) => value === '')).toHaveLength(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'missed', firstTry: false });
    });

    it('ignores a third tap during the reveal', () => {
        game.generateNewProblem();
        getToReveal();

        const solved = game.problemsSolved.value;
        const total = game.totalProblems.value;
        const timers = vi.getTimerCount();

        game.fillValue(1);
        game.checkAnswer();

        expect(game.problemsSolved.value).toBe(solved);
        expect(game.totalProblems.value).toBe(total);
        expect(vi.getTimerCount()).toBe(timers);
    });
});
