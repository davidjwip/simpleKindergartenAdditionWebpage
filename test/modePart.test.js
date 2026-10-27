// modePart.test.js — Increment 4: "Find the missing part".
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { generateProblem } from '../src/mathEngine';
import { useMathGame } from '../src/useMathGame';
import App from '../src/App.vue';

const STORAGE_KEY = 'mathGame.preferences';
const HOLD_DELAY = 1500;
const REVEAL_DELAY = 2500;
const AUTO_ADVANCE = 2000;
const LIMITS = [5, 10];

function solutionFor(game) {
    const operator = game.operator.value;
    const blank = game.blankField.value;
    const a = Number(game.num1.value);
    const b = Number(game.num2.value);
    const c = Number(game.answer.value);
    const solution = {
        num1: blank === 'num1' ? (operator === '+' ? c - b : c + b) : a,
        num2: blank === 'num2' ? (operator === '+' ? c - a : a - c) : b,
        answer: blank === 'answer' ? (operator === '+' ? a + b : a - b) : c
    };
    return { ...solution, blank };
}

function shownFields(game) {
    return [game.num1.value, game.num2.value, game.answer.value];
}

function wrongFor(value) {
    return value === 1 ? 2 : 1;
}

function correctValue(solution) {
    return solution[solution.blank];
}

function partBar(wrapper) {
    return wrapper.find('.dot-row');
}

function dotCounts(wrapper) {
    const dots = wrapper.findAll('.dot-row .dot');
    return {
        total: dots.length,
        filled: dots.filter((dot) => dot.classes('filled')).length,
        gap: dots.filter((dot) => dot.classes('gap')).length
    };
}

function expectedBar(solution, operator) {
    if (operator === '+') {
        return {
            total: solution.answer,
            known: solution.blank === 'num1' ? solution.num2 : solution.num1,
            missing: solution.blank === 'num1' ? solution.num1 : solution.num2
        };
    }
    return {
        total: solution.num1,
        known: solution.answer,
        missing: solution.num2
    };
}

async function mountPartApp({ limit = 10 } = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'part', maxLimit: limit }));
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    return wrapper;
}

async function openSettings(wrapper) {
    const headerBtns = wrapper.findAll('.header-actions .action-btn');
    await headerBtns[headerBtns.length - 1].trigger('click');
    return wrapper.find('.settings-panel');
}

function blankIndexOf(wrapper) {
    return wrapper.findAll('.problem input').findIndex((input) => input.element.value === '');
}

function correctValueFromApp(wrapper) {
    const inputs = wrapper.findAll('.problem input');
    const blank = blankIndexOf(wrapper);
    const operator = wrapper.find('.operator').text() === '+' ? '+' : '-';
    const [a, b, c] = inputs.map((input) => (
        input.element.value === '' ? null : Number(input.element.value)
    ));
    if (blank === 0) return operator === '+' ? c - b : c + b;
    if (blank === 1) return operator === '+' ? c - a : a - c;
    return operator === '+' ? a + b : a - b;
}

describe('generateProblem part mode', () => {
    it('blanks only operands for addition and never num1 for subtraction', () => {
        const additionBlanks = new Set();

        for (let i = 0; i < 200; i++) {
            const addition = generateProblem('+', 10, 'part');
            expect(['num1', 'num2']).toContain(addition.blankField);
            expect(addition.answer).toBe(addition.num1 + addition.num2);
            additionBlanks.add(addition.blankField);

            const subtraction = generateProblem('-', 10, 'part');
            expect(subtraction.blankField).toBe('num2');
            expect(subtraction.answer).toBe(subtraction.num1 - subtraction.num2);
        }

        expect(additionBlanks).toEqual(new Set(['num1', 'num2']));
    });

    it.each(LIMITS)('keeps every invariant at limit %i', (limit) => {
        for (const operator of ['+', '-']) {
            for (let i = 0; i < 200; i++) {
                const problem = generateProblem(operator, limit, 'part');
                expect(problem.num1).toBeGreaterThanOrEqual(1);
                expect(problem.num2).toBeGreaterThanOrEqual(1);
                expect(problem.answer).toBeGreaterThanOrEqual(1);
                expect(problem.num1).toBeLessThanOrEqual(limit);
                expect(problem.num2).toBeLessThanOrEqual(limit);
                expect(problem.answer).toBeLessThanOrEqual(limit);
                expect(problem[problem.blankField]).toBeGreaterThanOrEqual(1);
                expect(problem[problem.blankField]).toBeLessThanOrEqual(limit);

                if (operator === '+') {
                    expect(problem.answer).toBe(problem.num1 + problem.num2);
                } else {
                    expect(problem.num1).toBeGreaterThan(problem.num2);
                    expect(problem.num1).toBeGreaterThanOrEqual(2);
                    expect(problem.answer).toBe(problem.num1 - problem.num2);
                }
            }
        }
    });

    it('never generates a degenerate subtraction in part mode', () => {
        for (let i = 0; i < 1000; i++) {
            const problem = generateProblem('-', 10, 'part');
            expect(problem.num1).not.toBe(problem.num2);
            expect(problem.num1).not.toBe(1);
            expect(problem.answer).not.toBe(0);
        }
    });
});

describe('useMathGame part mode', () => {
    let game;

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

    it('derives the part-whole bar from the whole, the known part and the gap', () => {
        for (let i = 0; i < 50; i++) {
            game.generateNewProblem();
            const solution = solutionFor(game);
            const expected = expectedBar(solution, game.operator.value);

            expect(game.partWhole.value).toEqual(expected);
            expect(game.partWhole.value.total).toBe(
                game.partWhole.value.known + game.partWhole.value.missing
            );
        }
    });

    it('derives the subtraction bar with the remaining part known and the subtrahend missing', () => {
        game.setOperator('-');
        game.generateNewProblem();

        const solution = solutionFor(game);
        expect(solution.blank).toBe('num2');
        expect(game.partWhole.value).toEqual({
            total: solution.num1,
            known: solution.answer,
            missing: solution.num2
        });
    });

    it('scores a correct gap count as a correct first try', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        game.fillValue(correctValue(solution));

        expect(game.problemsSolved.value).toBe(1);
        expect(game.lastResult.value).toBe('correct');
        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'correct',
            firstTry: true
        });
    });

    it('holds the same printed equation, then re-arms one retry', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const before = shownFields(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        expect(game.isLocked.value).toBe(true);

        vi.advanceTimersByTime(HOLD_DELAY - 1);
        expect(game.isLocked.value).toBe(true);
        expect(shownFields(game)).toEqual(
            before.map((value, index) => (index === ['num1', 'num2', 'answer'].indexOf(solution.blank) ? String(wrong) : value))
        );

        vi.advanceTimersByTime(1);
        expect(game.isLocked.value).toBe(false);
        expect(game.blankField.value).toBe(solution.blank);
        expect(shownFields(game).filter((value) => value === '')).toHaveLength(1);
        expect(game.blankField.value).toBe(solution.blank);
    });

    it('scores a correct retry as solved and logs it as not first try', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        game.fillValue(wrongFor(correctValue(solution)));
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(correctValue(solution));

        expect(game.problemsSolved.value).toBe(1);
        expect(game.totalProblems.value).toBe(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'correct',
            firstTry: false
        });
        expect(vi.getTimerCount()).toBe(1);
    });

    it('completes the equation and logs a miss after a wrong retry', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);

        expect(game.isRevealing.value).toBe(true);
        expect(game.problemsSolved.value).toBe(0);
        expect(game.totalProblems.value).toBe(1);
        expect(shownFields(game)).toEqual([
            String(solution.num1),
            String(solution.num2),
            String(solution.answer)
        ]);
        expect(game.feedback.value).toContain(
            `${solution.num1} and ${solution.num2} make ${solution.answer}`
        );
        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'missed',
            firstTry: false
        });

        vi.advanceTimersByTime(REVEAL_DELAY);
        expect(game.isRevealing.value).toBe(false);
        expect(game.problemsSolved.value).toBe(0);
    });
});

describe('part mode boundaries and mode changes', () => {
    let game;

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

    it('discards an in-flight item unscored on a mode change mid-round', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        game.fillValue(wrongFor(correctValue(solution)));
        expect(vi.getTimerCount()).toBe(1);
        expect(game.itemLog.value).toHaveLength(0);

        game.setMode('result');

        expect(game.mode.value).toBe('result');
        expect(game.blankField.value).toBe('answer');
        expect(game.itemLog.value).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(0);

        vi.advanceTimersByTime(10000);
        expect(game.itemLog.value).toHaveLength(0);
    });

    it('cancels the 2 s advance and generates exactly one item in the new mode', () => {
        let generations = 0;
        game.setProgressCallback(() => {
            generations++;
        });

        game.generateNewProblem();
        const solution = solutionFor(game);
        game.fillValue(correctValue(solution));
        expect(vi.getTimerCount()).toBe(1);

        generations = 0;
        game.setMode('result');

        expect(generations).toBe(1);
        expect(vi.getTimerCount()).toBe(0);
        expect(game.mode.value).toBe('result');
        expect(game.blankField.value).toBe('answer');
    });

    it('keeps every part item keypad-reachable at limits 5 and 10', () => {
        for (const limit of LIMITS) {
            game.setMaxLimit(limit);
            for (const operator of ['+', '-']) {
                game.setOperator(operator);
                for (let i = 0; i < 200; i++) {
                    game.generateNewProblem();
                    const solution = solutionFor(game);
                    const missing = correctValue(solution);
                    expect(missing).toBeGreaterThanOrEqual(1);
                    expect(missing).toBeLessThanOrEqual(limit);
                    expect(game.keypadLength.value).toBe(limit);
                }
            }
        }
    });
});

describe('App part mode', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('offers Find the missing part in the adult picker and switches the screen', async () => {
        const wrapper = mount(App);

        await openSettings(wrapper);
        const option = wrapper.findAll('.mode-btn').find(
            (button) => button.text() === 'Find the missing part'
        );
        expect(option).toBeTruthy();

        await option.trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.mode).toBe('part');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).mode).toBe('part');
        expect(['num1', 'num2']).toContain(wrapper.vm.blankField);
        expect(partBar(wrapper).exists()).toBe(true);

        wrapper.unmount();
    });

    it('renders the whole, the known part and the gap for both addition blanks', async () => {
        const wrapper = await mountPartApp();
        const seen = new Set();

        for (let i = 0; i < 100 && seen.size < 2; i++) {
            wrapper.vm.generateNewProblem();
            await wrapper.vm.$nextTick();

            const blank = blankIndexOf(wrapper);
            if (blank === 2) continue;
            seen.add(blank);

            const inputs = wrapper.findAll('.problem input');
            const a = Number(inputs[0].element.value);
            const b = Number(inputs[1].element.value);
            const c = Number(inputs[2].element.value);
            const solution = blank === 0
                ? { num1: c - b, num2: b, answer: c, blank: 'num1' }
                : { num1: a, num2: c - a, answer: c, blank: 'num2' };
            const expected = expectedBar(solution, '+');
            const counts = dotCounts(wrapper);

            expect(counts.total).toBe(expected.total);
            expect(counts.filled).toBe(expected.known);
            expect(counts.gap).toBe(expected.missing);
        }

        expect(seen.size).toBe(2);
        wrapper.unmount();
    });

    it('renders the subtraction bar with the remaining part known and the subtrahend as the gap', async () => {
        const wrapper = await mountPartApp();
        await wrapper.find('.operator-toggle button:last-child').trigger('click');
        await wrapper.vm.$nextTick();

        for (let i = 0; i < 50; i++) {
            wrapper.vm.generateNewProblem();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.mode).toBe('part');
            expect(wrapper.vm.blankField).toBe('num2');

            const inputs = wrapper.findAll('.problem input');
            const a = Number(inputs[0].element.value);
            const c = Number(inputs[2].element.value);
            const b = a - c;
            const counts = dotCounts(wrapper);

            expect(inputs[1].element.value).toBe('');
            expect(counts.total).toBe(a);
            expect(counts.filled).toBe(c);
            expect(counts.gap).toBe(b);
        }

        wrapper.unmount();
    });

    it('keeps the bar inside the keypad limit at limit 5', async () => {
        const wrapper = await mountPartApp({ limit: 5 });

        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(5);

        for (let i = 0; i < 50; i++) {
            wrapper.vm.generateNewProblem();
            await wrapper.vm.$nextTick();

            const counts = dotCounts(wrapper);
            expect(counts.total).toBeGreaterThanOrEqual(1);
            expect(counts.total).toBeLessThanOrEqual(5);
            expect(counts.filled + counts.gap).toBe(counts.total);
        }

        wrapper.unmount();
    });

    it('fills the bar gap and completes the equation on the second wrong tap', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountPartApp();
            const correct = correctValueFromApp(wrapper);
            const wrong = wrongFor(correct);

            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            vi.advanceTimersByTime(HOLD_DELAY);
            await wrapper.vm.$nextTick();
            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            await wrapper.vm.$nextTick();

            const inputs = wrapper.findAll('.problem input');
            expect(wrapper.vm.isRevealing).toBe(true);
            expect(inputs.some((input) => input.element.value === '')).toBe(false);
            expect(dotCounts(wrapper).gap).toBe(0);
            expect(dotCounts(wrapper).filled).toBe(dotCounts(wrapper).total);
            expect(wrapper.find('#feedback').text()).not.toBe('');

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('does not render the part-whole bar outside part mode', async () => {
        const wrapper = mount(App);

        expect(wrapper.vm.mode).toBe('result');
        expect(partBar(wrapper).exists()).toBe(false);

        wrapper.unmount();
    });
});
