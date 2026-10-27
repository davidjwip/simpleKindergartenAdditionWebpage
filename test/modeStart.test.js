// modeStart.test.js — Increment 5: "Find what we started with".
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { generateProblem } from '../src/mathEngine';
import { useMathGame } from '../src/useMathGame';
import App from '../src/App.vue';

const STORAGE_KEY = 'mathGame.preferences';
const HOLD_DELAY = 1500;
const REVEAL_DELAY = 2500;
const AUTO_ADVANCE = 2000;

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

function dotCounts(wrapper) {
    const dots = wrapper.findAll('.dot-row .dot');
    return {
        total: dots.length,
        filled: dots.filter((dot) => dot.classes('filled')).length,
        gap: dots.filter((dot) => dot.classes('gap')).length,
        taken: dots.filter((dot) => dot.classes('taken')).length
    };
}

async function mountStartApp({ limit = 10 } = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'start', maxLimit: limit }));
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();
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

describe('generateProblem start mode', () => {
    it('always prints ? - b = c with the start inside the limit', () => {
        for (const limit of [5, 10, 20]) {
            for (let i = 0; i < 200; i++) {
                const problem = generateProblem('-', limit, 'start');

                expect(problem.operator).toBe('-');
                expect(problem.mode).toBe('start');
                expect(problem.blankField).toBe('num1');
                expect(problem.num1).toBe(problem.num2 + problem.answer);
                expect(problem.num1).toBeLessThanOrEqual(limit);
                expect(problem.num2).toBeGreaterThanOrEqual(1);
                expect(problem.answer).toBeGreaterThanOrEqual(1);
                expect(problem.num1).toBeGreaterThan(problem.num2);
            }
        }
    });

    it('never generates a start item under addition', () => {
        expect(() => generateProblem('+', 10, 'start')).toThrow(RangeError);
    });

    it('keeps no zero and no degenerate item across 1,000 start draws', () => {
        for (let i = 0; i < 1000; i++) {
            const problem = generateProblem('-', 10, 'start');
            expect(problem.num1).not.toBe(problem.num2);
            expect(problem.num1).not.toBe(1);
            expect(problem.num2).not.toBe(0);
            expect(problem.answer).not.toBe(0);
            expect(problem[problem.blankField]).toBeGreaterThanOrEqual(1);
            expect(problem[problem.blankField]).toBeLessThanOrEqual(10);
        }
    });
});

describe('useMathGame start mode', () => {
    let game;

    beforeEach(() => {
        vi.useFakeTimers();
        game = useMathGame();
        game.setOperator('-');
        game.setMode('start');
        game.resetProgress();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('builds the bar from the remaining dots and the taken-away dots', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        expect(solution.blank).toBe('num1');
        expect(game.startBar.value).toEqual({
            total: solution.num1,
            known: solution.answer,
            takenAway: solution.num2
        });
        expect(game.startBar.value.total).toBe(
            game.startBar.value.known + game.startBar.value.takenAway
        );
    });

    it('has no start bar outside start mode', () => {
        game.setMode('result');
        expect(game.startBar.value).toBeNull();
    });

    it('puts the taken-away dots back without scoring or logging an answer', () => {
        game.generateNewProblem();

        game.putBack();

        expect(game.putBackDone.value).toBe(true);
        expect(game.putBackUsed.value).toBe(true);
        expect(game.problemsSolved.value).toBe(0);
        expect(game.totalProblems.value).toBe(0);
        expect(game.itemLog.value).toHaveLength(0);
        expect(game.isLocked.value).toBe(false);
    });

    it('scores a correct first tap after the put-back and logs putBackUsed true', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        game.putBack();
        game.fillValue(correctValue(solution));

        expect(game.problemsSolved.value).toBe(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'correct',
            firstTry: true,
            mode: 'start',
            putBackUsed: true
        });
    });

    it('logs putBackUsed false when the first tap is correct without the put-back', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        game.fillValue(correctValue(solution));

        expect(game.problemsSolved.value).toBe(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'correct',
            firstTry: true,
            mode: 'start',
            putBackUsed: false
        });
    });

    it('does not count a put-back tapped after the first answer tap as used', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const correct = correctValue(solution);

        game.fillValue(wrongFor(correct));
        vi.advanceTimersByTime(HOLD_DELAY);
        game.putBack();
        game.fillValue(correct);

        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'correct',
            firstTry: false,
            putBackUsed: false
        });
    });

    it('ignores the put-back outside start mode', () => {
        game.setMode('result');

        game.putBack();

        expect(game.putBackDone.value).toBe(false);
        expect(game.putBackUsed.value).toBe(false);
    });

    it('performs the put-back in the reveal and logs the item as missed', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);

        expect(game.isRevealing.value).toBe(true);
        expect(game.putBackDone.value).toBe(true);
        expect(game.putBackUsed.value).toBe(false);
        expect(game.problemsSolved.value).toBe(0);
        expect(shownFields(game)).toEqual([
            String(solution.num1),
            String(solution.num2),
            String(solution.answer)
        ]);
        expect(game.feedback.value).toContain('We started with');
        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'missed',
            mode: 'start',
            putBackUsed: false
        });

        vi.advanceTimersByTime(REVEAL_DELAY);
        expect(game.problemsSolved.value).toBe(0);
    });

    it('keeps putBackUsed true if the child used the put-back before the reveal', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.putBack();
        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);

        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'missed',
            putBackUsed: true
        });
    });

    it('resets the put-back state for the next item', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        game.putBack();
        game.fillValue(correctValue(solution));

        vi.advanceTimersByTime(AUTO_ADVANCE);

        expect(game.putBackDone.value).toBe(false);
        expect(game.putBackUsed.value).toBe(false);
    });

    it('caps its generator and keypad at 10 without discarding the stored limit', () => {
        game.setMode('result');
        game.setMaxLimit(20);
        game.setMode('start');

        expect(game.maxLimit.value).toBe(20);
        expect(game.keypadLength.value).toBe(10);

        for (let i = 0; i < 200; i++) {
            game.generateNewProblem();
            const solution = solutionFor(game);
            expect(correctValue(solution)).toBeLessThanOrEqual(10);
            expect(game.keypadLength.value).toBe(10);
        }

        game.setMode('result');
        expect(game.maxLimit.value).toBe(20);
        expect(game.keypadLength.value).toBe(20);
    });

    it('keeps the start keypad at the limit when the limit is below 10', () => {
        game.setMaxLimit(5);

        expect(game.keypadLength.value).toBe(5);

        for (let i = 0; i < 30; i++) {
            game.generateNewProblem();
            expect(correctValue(solutionFor(game))).toBeLessThanOrEqual(5);
        }
    });

    it('discards an in-flight item unscored on a mode change', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        game.fillValue(wrongFor(correctValue(solution)));
        expect(vi.getTimerCount()).toBe(1);

        game.setMode('result');

        expect(game.mode.value).toBe('result');
        expect(game.blankField.value).toBe('answer');
        expect(game.itemLog.value).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels the advance and generates exactly one item in the new mode', () => {
        let generations = 0;
        game.setProgressCallback(() => {
            generations++;
        });

        game.generateNewProblem();
        game.fillValue(correctValue(solutionFor(game)));
        expect(vi.getTimerCount()).toBe(1);

        generations = 0;
        game.setMode('result');

        expect(generations).toBe(1);
        expect(vi.getTimerCount()).toBe(0);
        expect(game.mode.value).toBe('result');
        expect(game.blankField.value).toBe('answer');
    });

    it('keeps the missed item when the mode changes during the reveal', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);
        expect(game.itemLog.value).toHaveLength(1);

        game.setMode('result');

        expect(game.mode.value).toBe('result');
        expect(game.itemLog.value).toHaveLength(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'missed' });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('preserves the step across a mode change and the mode across a step change', () => {
        game.setMode('result');
        game.setStep('1');
        game.setMode('start');

        expect(game.mode.value).toBe('start');
        expect(game.step.value).toBe('1');
        game.generateNewProblem();
        expect(Number(game.num2.value)).toBe(1);

        game.setStep('2');

        expect(game.mode.value).toBe('start');
        expect(game.step.value).toBe('2');
        expect(Number(game.num2.value)).toBe(2);
    });

    it('selects subtraction when the start task is chosen under addition', () => {
        game.setOperator('+');

        game.setMode('start');

        expect(game.operator.value).toBe('-');
        expect(game.mode.value).toBe('start');
    });

    it('surfaces the take-away constraint instead of silently ignoring +', () => {
        game.generateNewProblem();

        game.setOperator('+');

        expect(game.operator.value).toBe('-');
        expect(game.mode.value).toBe('start');
        expect(game.feedback.value).toMatch(/take-away/i);
        expect(game.feedbackColor.value).not.toBe('#ff6b6b');
    });

    it('shows the take-away advisory during a retry without changing the item', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        game.fillValue(wrongFor(correctValue(solution)));
        vi.advanceTimersByTime(HOLD_DELAY);
        const before = shownFields(game);

        game.setOperator('+');

        expect(game.operator.value).toBe('-');
        expect(game.feedback.value).toMatch(/take-away/i);
        expect(shownFields(game)).toEqual(before);
    });

    it('keeps the correct-answer feedback when + is tapped after the answer', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);

        game.fillValue(correctValue(solution));
        const correctMessage = game.feedback.value;
        expect(game.problemsSolved.value).toBe(1);

        game.setOperator('+');

        expect(game.operator.value).toBe('-');
        expect(game.feedback.value).toBe(correctMessage);
        expect(game.feedback.value).not.toMatch(/take-away/i);
    });

    it('keeps the pre-start log shape for result items', () => {
        game.setMode('result');
        game.generateNewProblem();
        game.fillValue(correctValue(solutionFor(game)));

        expect(game.itemLog.value.at(-1)).toEqual({
            outcome: 'correct',
            firstTry: true,
            step: 'any'
        });
    });

    it('keeps the pre-start log shape for part items', () => {
        game.setMode('part');
        game.generateNewProblem();
        game.fillValue(correctValue(solutionFor(game)));

        expect(game.itemLog.value.at(-1)).toEqual({
            outcome: 'correct',
            firstTry: true,
            step: 'any'
        });
    });

    it('keeps the missed item when the same mode is reselected during the reveal', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);
        expect(game.itemLog.value).toHaveLength(1);

        game.setMode('start');

        expect(game.mode.value).toBe('start');
        expect(game.itemLog.value).toHaveLength(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'missed' });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('keeps the missed item when the step changes during the reveal', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);
        expect(game.itemLog.value).toHaveLength(1);

        game.setStep('2');

        expect(game.mode.value).toBe('start');
        expect(game.itemLog.value).toHaveLength(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'missed' });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('keeps the missed item when the operator changes during the reveal', () => {
        game.setMode('result');
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);
        expect(game.itemLog.value).toHaveLength(1);

        game.setOperator('+');

        expect(game.operator.value).toBe('+');
        expect(game.itemLog.value).toHaveLength(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'missed' });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('keeps the miss after the reveal plays to completion', () => {
        game.generateNewProblem();
        const solution = solutionFor(game);
        const wrong = wrongFor(correctValue(solution));

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);
        game.fillValue(wrong);
        expect(game.itemLog.value).toHaveLength(1);

        vi.advanceTimersByTime(REVEAL_DELAY);

        expect(game.itemLog.value).toHaveLength(1);
        expect(game.itemLog.value.at(-1)).toMatchObject({ outcome: 'missed' });
    });
});

describe('App start mode', () => {
    it('offers the start task and advises on step without disabling it under addition', async () => {
        const wrapper = mount(App);

        const settings = await openSettings(wrapper);
        const option = wrapper.findAll('.mode-btn').find(
            (button) => button.text() === 'Find what we started with'
        );
        expect(option).toBeTruthy();
        expect(option.element.disabled).toBe(false);
        expect(settings.text()).not.toContain("that one's a take-away game");
        expect(settings.text()).toContain('keep step at 1');
        expect(settings.text()).toContain('start with step 1–2');

        expect(wrapper.vm.operator).toBe('+');
        await option.trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.mode).toBe('start');
        expect(wrapper.vm.operator).toBe('-');
        expect(wrapper.find('.dot-row').exists()).toBe(true);
        wrapper.unmount();
    });

    it('surfaces the take-away constraint when + is chosen in start mode', async () => {
        const wrapper = await mountStartApp();
        const before = wrapper.vm.operator;

        await wrapper.find('.operator-toggle button:first-child').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.operator).toBe(before);
        expect(wrapper.vm.mode).toBe('start');
        expect(wrapper.find('#feedback').text()).toMatch(/take-away/i);
        wrapper.unmount();
    });

    it('renders the remaining dots filled and the taken-away dots as ghosts', async () => {
        const wrapper = await mountStartApp();
        const inputs = wrapper.findAll('.problem input');

        expect(inputs[0].element.value).toBe('');
        const takenAway = Number(inputs[1].element.value);
        const remaining = Number(inputs[2].element.value);
        const counts = dotCounts(wrapper);

        expect(counts.total).toBe(takenAway + remaining);
        expect(counts.filled).toBe(remaining);
        expect(counts.taken).toBe(takenAway);
        expect(wrapper.findAll('.taken-away .dot.taken')).toHaveLength(takenAway);
        expect(wrapper.find('.taken-away').exists()).toBe(true);
        wrapper.unmount();
    });

    it('fills the ghost dots on a put-back tap and still requires the keypad answer', async () => {
        const wrapper = await mountStartApp();
        const correct = correctValueFromApp(wrapper);
        const before = dotCounts(wrapper);

        await wrapper.find('.taken-away').trigger('click');
        await wrapper.vm.$nextTick();

        const after = dotCounts(wrapper);
        expect(after.filled).toBe(before.total);
        expect(after.gap).toBe(0);
        expect(after.taken).toBe(0);
        expect(wrapper.find('.taken-away').exists()).toBe(false);
        expect(wrapper.findAll('.problem input')[0].element.value).toBe('');
        expect(wrapper.vm.problemsSolved).toBe(0);

        await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.problemsSolved).toBe(1);
        wrapper.unmount();
    });

    it('renders countable rows at limit 5 without a key above 5', async () => {
        const wrapper = await mountStartApp({ limit: 5 });

        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(5);

        for (let i = 0; i < 30; i++) {
            wrapper.vm.generateNewProblem();
            await wrapper.vm.$nextTick();

            const inputs = wrapper.findAll('.problem input');
            const takenAway = Number(inputs[1].element.value);
            const remaining = Number(inputs[2].element.value);
            const counts = dotCounts(wrapper);

            expect(takenAway + remaining).toBeLessThanOrEqual(5);
            expect(counts.filled).toBe(remaining);
            expect(counts.taken).toBe(takenAway);
            expect(counts.total).toBe(remaining + takenAway);
        }

        wrapper.unmount();
    });

    it('performs the put-back and completes the equation on the second wrong tap', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountStartApp();
            const correct = correctValueFromApp(wrapper);
            const wrong = wrongFor(correct);

            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            vi.advanceTimersByTime(HOLD_DELAY);
            await wrapper.vm.$nextTick();
            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            await wrapper.vm.$nextTick();

            const inputs = wrapper.findAll('.problem input');
            expect(wrapper.vm.isRevealing).toBe(true);
            expect(inputs[0].element.value).toBe(String(correct));
            expect(inputs[0].classes()).toContain('reveal-highlight');
            expect(dotCounts(wrapper).gap).toBe(0);
            expect(dotCounts(wrapper).filled).toBe(dotCounts(wrapper).total);
            expect(wrapper.find('#feedback').text()).toContain('We started with');

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('plays start at 10 and disables the 15 and 20 limits while it is selected', async () => {
        const wrapper = await mountStartApp({ limit: 20 });
        const headerBtns = wrapper.findAll('.header-actions .action-btn');

        expect(wrapper.vm.mode).toBe('start');
        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(10);
        expect(headerBtns[3].text()).toBe('🔢 Limit: 10');

        await headerBtns[3].trigger('click');

        const presets = wrapper.findAll('.limit-preset-btn');
        expect(presets.map((preset) => preset.text())).toEqual(['5', '10', '15', '20']);
        expect(presets[2].element.disabled).toBe(true);
        expect(presets[3].element.disabled).toBe(true);
        expect(wrapper.find('.limit-cap-note').text()).toContain('10');

        await wrapper.find('.limit-actions .action-btn:first-child').trigger('click');
        await openSettings(wrapper);
        const resultOption = wrapper.findAll('.mode-btn').find(
            (button) => button.text() === 'Find the total'
        );
        await resultOption.trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.mode).toBe('result');
        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(20);
        expect(headerBtns[3].text()).toBe('🔢 Limit: 20');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).maxLimit).toBe(20);

        wrapper.unmount();
    });

    it('keeps the stored limit while the start keypad stays at 10', async () => {
        const wrapper = await mountStartApp({ limit: 20 });
        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];

        await limitBtn.trigger('click');
        await wrapper.find('input[type="number"]').setValue(20);
        await wrapper.find('.limit-actions .action-btn:last-child').trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(10);
        expect(wrapper.vm.maxLimit).toBe(20);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).maxLimit).toBe(20);
        expect(wrapper.find('.limit-popup').exists()).toBe(false);

        wrapper.unmount();
    });

    it('keeps the stored limit when the start popup is saved unchanged', async () => {
        const wrapper = await mountStartApp({ limit: 20 });
        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];

        await limitBtn.trigger('click');
        await wrapper.find('.limit-actions .action-btn:last-child').trigger('click');
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(10);
        expect(wrapper.vm.maxLimit).toBe(20);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).maxLimit).toBe(20);

        wrapper.unmount();
    });

    it('explains the start cap as a play cap, not a saved-limit cap', async () => {
        const wrapper = await mountStartApp({ limit: 20 });
        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];

        await limitBtn.trigger('click');

        const text = wrapper.find('.limit-popup-content').text();
        expect(text).toContain('up to 10');
        expect(text).toMatch(/other tasks/i);
        expect(text).not.toContain('Choose a number between 5 and 10');

        wrapper.unmount();
    });

    it('forces the counters on in start mode even when counters are persisted off', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            mode: 'start',
            maxLimit: 10,
            countersOn: false
        }));
        const wrapper = mount(App);
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.mode).toBe('start');
        expect(wrapper.find('.dot-row').exists()).toBe(true);

        const takenAway = wrapper.find('.taken-away');
        expect(takenAway.exists()).toBe(true);
        expect(takenAway.element.disabled).toBe(false);

        await takenAway.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.taken-away').exists()).toBe(false);
        expect(wrapper.findAll('.dot-row .dot.taken')).toHaveLength(0);

        wrapper.unmount();
    });

    it('does not render the start bar outside start mode', async () => {
        const wrapper = mount(App);

        expect(wrapper.vm.mode).toBe('result');
        expect(wrapper.find('.dot-row').exists()).toBe(false);
        wrapper.unmount();
    });
});
