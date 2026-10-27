// anchorFacts.test.js — Increment 3c-1: make-ten mode, effective keypad,
// pass-length round, frame reveal, log fields and preferences.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { useMathGame } from '../src/useMathGame';
import { usePreferences } from '../src/usePreferences';
import { buildPass, makeRng } from '../src/anchorEngine';
import App from '../src/App.vue';

const STORAGE_KEY = 'mathGame.preferences';
const AUTO_ADVANCE = 2000;
const HOLD_DELAY = 1500;
const REVEAL_DELAY = 2500;
const BUCKETS = ['<2s', '2-5s', '>5s'];

function fields(game) {
    return [game.num1.value, game.num2.value, game.answer.value];
}

function solutionFor(game) {
    const blank = game.blankField.value;
    const a = Number(game.num1.value);
    const b = Number(game.num2.value);
    const c = Number(game.answer.value);
    return {
        blank,
        num1: blank === 'num1' ? c - b : a,
        num2: blank === 'num2' ? c - a : b,
        answer: blank === 'answer' ? a + b : c
    };
}

function expectedValue(game) {
    const solution = solutionFor(game);
    return solution[game.blankField.value];
}

function num2For(game) {
    return solutionFor(game).num2;
}

function answerCorrect(game) {
    game.fillValue(expectedValue(game));
}

function answerWrong(game) {
    const correct = expectedValue(game);
    game.fillValue(correct === 1 ? 2 : 1);
}

function boundaryCollisionSeed(total = 10) {
    for (let seed = Date.UTC(2026, 0, 1); seed < Date.UTC(2026, 0, 2); seed++) {
        const rng = makeRng(seed);
        const first = buildPass(total, rng);
        const second = buildPass(total, rng);
        const last = first[first.length - 1];
        const head = second[0];
        if (last.num1 === head.num1 && last.num2 === head.num2) return seed;
    }
    throw new Error('no pass-boundary collision seed found');
}

function mountPreferences() {
    const state = {};
    const Host = defineComponent({
        setup() {
            Object.assign(state, usePreferences());
            return () => h('div');
        }
    });
    return { wrapper: mount(Host), state };
}

async function mountApp(seed = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    return wrapper;
}

async function openSettings(wrapper) {
    if (!wrapper.find('.settings-panel').exists()) {
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        await headerBtns[headerBtns.length - 1].trigger('click');
    }
    return wrapper.find('.settings-panel');
}

async function selectMode(wrapper, label) {
    await openSettings(wrapper);
    const button = wrapper.findAll('.mode-btn').find((entry) => entry.text() === label);
    expect(button).toBeTruthy();
    await button.trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
}

function problemInputs(wrapper) {
    return wrapper.findAll('.problem input');
}

function correctValueFromApp(wrapper) {
    const inputs = problemInputs(wrapper);
    const blank = inputs.findIndex((input) => input.element.value === '');
    const [a, b, c] = inputs.map((input) => (
        input.element.value === '' ? null : Number(input.element.value)
    ));
    if (blank === 0) return c - b;
    if (blank === 1) return c - a;
    return a + b;
}

describe('useMathGame anchor mode', () => {
    let game;

    beforeEach(() => {
        vi.useFakeTimers();
        game = useMathGame();
        game.setOperator('+');
        game.resetProgress();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts make-ten with a 9-item round and a 1..10 keypad', () => {
        game.setMode('anchor');

        expect(game.mode.value).toBe('anchor');
        expect(game.anchorTotal.value).toBe(10);
        expect(game.roundLength.value).toBe(9);
        expect(game.keypadLength.value).toBe(10);
        expect(game.blankField.value).not.toBe('answer');
    });

    it('advances the round on its own 9 items, not on the cumulative solved count', () => {
        game.setMode('anchor');
        game.problemsSolved.value = 4;

        for (let i = 0; i < 9; i++) {
            answerCorrect(game);
            if (i < 8) vi.advanceTimersByTime(AUTO_ADVANCE);
        }

        expect(game.problemsSolved.value).toBe(13);
        expect(game.roundProgress.value).toBe(9);

        // The timer alone does not start a new round; closing the celebration
        // (or resetProgress) is what clears the completed counter.
        vi.advanceTimersByTime(AUTO_ADVANCE);
        expect(game.roundProgress.value).toBe(9);
        expect(game.roundLength.value).toBe(9);

        game.resetProgress();
        expect(game.roundProgress.value).toBe(0);
    });

    it('ignores the step setting and still covers 1..9 as the other operand', () => {
        game.setStep('1');
        game.setMode('anchor');

        const seen = [num2For(game)];
        for (let i = 0; i < 8; i++) {
            game.generateNewProblem();
            seen.push(num2For(game));
        }

        expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('derives the keypad from the family even when the stored limit is 5', () => {
        game.setMaxLimit(5);
        game.setMode('anchor');

        expect(game.keypadLength.value).toBe(10);
        expect(game.maxLimit.value).toBe(5);
    });

    it('keeps a limit change inert during anchor and applies it on leaving', () => {
        game.setMode('anchor');
        const before = fields(game);

        game.setMaxLimit(20);

        expect(fields(game)).toEqual(before);
        expect(game.keypadLength.value).toBe(10);
        expect(game.maxLimit.value).toBe(20);

        game.setMode('result');
        expect(game.keypadLength.value).toBe(20);
        expect(game.roundLength.value).toBe(10);
    });

    it('keeps a step change inert during anchor and applies it on leaving', () => {
        game.setMode('anchor');
        const before = fields(game);

        game.setStep('3-5');

        expect(fields(game)).toEqual(before);
        expect(game.mode.value).toBe('anchor');

        game.setMode('result');
        expect([3, 4, 5]).toContain(num2For(game));
    });

    it('clears the pending timer and discards the abandoned item unscored on a mode change', () => {
        game.setMode('anchor');
        answerWrong(game);
        expect(vi.getTimerCount()).toBe(1);
        expect(game.itemLog.value).toHaveLength(0);

        game.setMode('result');

        expect(vi.getTimerCount()).toBe(0);
        expect(game.itemLog.value).toHaveLength(0);
        expect(game.keypadLength.value).toBe(10);
        expect(game.roundLength.value).toBe(10);

        vi.advanceTimersByTime(10000);
        expect(game.itemLog.value).toHaveLength(0);
    });

    it('rebuilds item, keypad and track atomically on a family change mid-pass', () => {
        game.setMode('anchor');
        let generations = 0;
        game.setProgressCallback(() => {
            generations++;
        });

        game.setAnchorTotal(5);

        expect(game.anchorTotal.value).toBe(5);
        expect(game.keypadLength.value).toBe(5);
        expect(game.roundLength.value).toBe(8);
        expect(generations).toBe(1);

        game.setAnchorTotal(10);
        expect(game.anchorTotal.value).toBe(10);
        expect(game.keypadLength.value).toBe(10);
        expect(game.roundLength.value).toBe(9);
    });

    it('clears a pending hold timer and generates once on a family change', () => {
        game.setMode('anchor');
        let generations = 0;
        game.setProgressCallback(() => {
            generations++;
        });

        answerWrong(game);
        expect(vi.getTimerCount()).toBe(1);

        generations = 0;
        game.setAnchorTotal(5);

        expect(generations).toBe(1);
        expect(vi.getTimerCount()).toBe(0);
        expect(game.anchorTotal.value).toBe(5);
        expect(game.roundLength.value).toBe(8);
    });

    it('does not serve the last bond again as the first bond of the next pass', () => {
        const seed = boundaryCollisionSeed();
        vi.setSystemTime(seed);
        const fresh = useMathGame();
        fresh.setMode('anchor');

        for (let i = 0; i < fresh.roundLength.value - 1; i++) {
            fresh.generateNewProblem();
        }
        const previous = fields(fresh);

        fresh.generateNewProblem();
        expect(fields(fresh)).not.toEqual(previous);
    });

    it('logs a first-try anchor answer with mode, kind, total, blank and latency bucket', () => {
        game.setMode('anchor');
        const blankField = game.blankField.value;

        answerCorrect(game);

        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'correct',
            firstTry: true,
            mode: 'anchor',
            kind: 'bond',
            total: 10,
            blankField,
            firstTapBucket: expect.any(String)
        });
        expect(BUCKETS).toContain(game.itemLog.value.at(-1).firstTapBucket);
    });

    it('logs a correct retry as firstTry false in anchor mode', () => {
        game.setMode('anchor');
        answerWrong(game);
        vi.advanceTimersByTime(HOLD_DELAY);
        answerCorrect(game);

        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'correct',
            firstTry: false,
            mode: 'anchor',
            kind: 'bond',
            total: 10
        });
    });

    it('logs a revealed anchor item as missed with its latency bucket', () => {
        game.setMode('anchor');
        vi.advanceTimersByTime(3000);
        answerWrong(game);
        vi.advanceTimersByTime(HOLD_DELAY);
        answerWrong(game);

        expect(game.itemLog.value.at(-1)).toMatchObject({
            outcome: 'missed',
            firstTry: false,
            mode: 'anchor',
            kind: 'bond',
            total: 10,
            firstTapBucket: '2-5s'
        });
    });
});

describe('App anchor mode', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders 1..10 and a matching grid with a stored limit of 5', async () => {
        const wrapper = await mountApp({ mode: 'anchor', maxLimit: 5 });

        const buttons = wrapper.findAll('.touchpad-btn');
        expect(buttons).toHaveLength(10);
        expect(buttons.map((button) => button.text())).toEqual(
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        );
        expect(wrapper.find('.touchpad').attributes('style')).toContain('repeat(4');
        expect(wrapper.findAll('.step')).toHaveLength(9);
        expect(wrapper.find('.anchor-summary').text()).toContain('first-try here means the frame was read');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).maxLimit).toBe(5);

        wrapper.unmount();
    });

    it('renders the frame with the shown part filled and the answer cells empty', async () => {
        const wrapper = await mountApp({ mode: 'anchor', maxLimit: 5 });

        for (const blankField of ['num1', 'num2']) {
            let inputs = problemInputs(wrapper);
            for (let i = 0; i < 20 && inputs[blankField === 'num1' ? 0 : 1].element.value !== ''; i++) {
                wrapper.vm.generateNewProblem();
                await wrapper.vm.$nextTick();
                inputs = problemInputs(wrapper);
            }

            const shown = Number(inputs[blankField === 'num1' ? 1 : 0].element.value);
            const total = Number(inputs[2].element.value);
            expect(wrapper.findAll('.frame-cell')).toHaveLength(10);
            expect(wrapper.findAll('.frame-cell.filled')).toHaveLength(shown);
            expect(wrapper.findAll('.frame-cell.empty')).toHaveLength(total - shown);
        }

        wrapper.unmount();
    });

    it('fills the frame and completes the equation on the second wrong tap', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountApp({ mode: 'anchor' });
            const correct = correctValueFromApp(wrapper);
            const wrong = correct === 1 ? 2 : 1;

            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            vi.advanceTimersByTime(HOLD_DELAY);
            await wrapper.vm.$nextTick();
            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.isRevealing).toBe(true);
            expect(wrapper.findAll('.frame-cell.empty')).toHaveLength(0);
            expect(wrapper.findAll('.frame-cell.filled')).toHaveLength(10);
            expect(problemInputs(wrapper).some((input) => input.element.value === '')).toBe(false);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('advances the round on every missed anchor and celebrates at the boundary', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountApp({ mode: 'anchor' });
            const roundLength = wrapper.vm.roundLength;

            for (let i = 0; i < roundLength; i++) {
                const correct = correctValueFromApp(wrapper);
                const wrong = correct === 1 ? 2 : 1;

                await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
                vi.advanceTimersByTime(HOLD_DELAY);
                await wrapper.vm.$nextTick();
                await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.isRevealing).toBe(true);
                expect(wrapper.vm.roundProgress).toBe(i + 1);

                if (i < roundLength - 1) {
                    expect(wrapper.vm.celebrationVisible).toBe(false);
                    vi.advanceTimersByTime(REVEAL_DELAY);
                    await wrapper.vm.$nextTick();
                }
            }

            expect(wrapper.vm.roundProgress).toBe(roundLength);
            expect(wrapper.vm.celebrationVisible).toBe(true);
            expect(wrapper.find('.celebration-overlay').classes('visible')).toBe(true);
            expect(vi.getTimerCount()).toBe(0);

            const revealed = problemInputs(wrapper).map((input) => input.element.value);
            vi.advanceTimersByTime(REVEAL_DELAY);
            await wrapper.vm.$nextTick();
            expect(problemInputs(wrapper).map((input) => input.element.value)).toEqual(revealed);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('celebrates an all-correct pass with the credited count', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountApp({ mode: 'anchor' });
            const roundLength = wrapper.vm.roundLength;

            for (let i = 0; i < roundLength; i++) {
                const correct = correctValueFromApp(wrapper);
                await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
                if (i < roundLength - 1) {
                    vi.advanceTimersByTime(AUTO_ADVANCE);
                    await wrapper.vm.$nextTick();
                }
            }

            expect(wrapper.vm.celebrationVisible).toBe(true);
            expect(wrapper.find('.celebration-content').text()).toContain(
                `You solved ${roundLength} problems correctly!`
            );

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('offers Make 10 in the adult picker and switches the whole screen', async () => {
        const wrapper = await mountApp();

        await selectMode(wrapper, 'Make 10');

        expect(wrapper.vm.mode).toBe('anchor');
        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(10);
        expect(wrapper.findAll('.step')).toHaveLength(9);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).mode).toBe('anchor');

        wrapper.unmount();
    });

    it('leaves the stored limit alone while anchor is active and restores it on exit', async () => {
        const wrapper = await mountApp();

        await selectMode(wrapper, 'Make 10');
        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];
        await limitBtn.trigger('click');
        await wrapper.find('input[type="number"]').setValue(20);
        await wrapper.find('.limit-actions .action-btn:last-child').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(10);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).maxLimit).toBe(20);

        await selectMode(wrapper, 'Find the total');

        expect(wrapper.vm.mode).toBe('result');
        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(20);

        wrapper.unmount();
    });
});

describe('anchor preferences', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults anchorTotal to 10 and round-trips the supported totals', () => {
        const { wrapper, state } = mountPreferences();
        expect(state.anchorTotal.value).toBe(10);

        state.setAnchorTotal(5);
        expect(state.anchorTotal.value).toBe(5);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).anchorTotal).toBe(5);

        state.setAnchorTotal(10);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).anchorTotal).toBe(10);
        wrapper.unmount();
    });

    it('loads 10 when the stored anchorTotal is invalid', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ anchorTotal: 7 }));

        const { wrapper, state } = mountPreferences();

        expect(state.anchorTotal.value).toBe(10);
        wrapper.unmount();
    });

    it('persists and rehydrates the anchor mode', () => {
        const first = mountPreferences();
        first.state.setMode('anchor');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).mode).toBe('anchor');
        first.wrapper.unmount();

        const { wrapper, state } = mountPreferences();
        expect(state.mode.value).toBe('anchor');
        wrapper.unmount();
    });
});
