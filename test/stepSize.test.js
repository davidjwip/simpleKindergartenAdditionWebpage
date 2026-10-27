// stepSize.test.js — Increment 3b: the step size generation parameter.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import {
    generateAddition,
    generateSubtraction,
    generateProblem
} from '../src/mathEngine';
import { useMathGame } from '../src/useMathGame';
import { usePreferences } from '../src/usePreferences';
import App from '../src/App.vue';

const STORAGE_KEY = 'mathGame.preferences';
const STEPS = ['1', '2', '3-5', 'any'];
const VALID_PAIRS = [
    ['+', 'result'],
    ['+', 'part'],
    ['-', 'result'],
    ['-', 'part'],
    ['-', 'start']
];

function stepValues(step) {
    if (step === '1') return [1];
    if (step === '2') return [2];
    if (step === '3-5') return [3, 4, 5];
    return null;
}

function expectInvariants(problem, limit, operator) {
    expect(Object.keys(problem)).not.toContain('step');
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
        expect(problem.answer).toBe(problem.num1 - problem.num2);
    }
}

function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
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

describe('generateProblem step ceiling', () => {
    it('records no step field on the item shape', () => {
        for (const step of STEPS) {
            for (const [operator, mode] of VALID_PAIRS) {
                const problem = generateProblem(operator, 10, mode, step);
                expect(Object.keys(problem).sort()).toEqual(
                    ['answer', 'blankField', 'mode', 'num1', 'num2', 'operator'].sort()
                );
            }
        }
    });

    it('step 1 always adds or takes away exactly 1 in every mode', () => {
        for (const [operator, mode] of VALID_PAIRS) {
            for (let i = 0; i < 200; i++) {
                const problem = generateProblem(operator, 10, mode, '1');
                expect(problem.num2).toBe(1);
                expectInvariants(problem, 10, operator);
            }
        }
    });

    it('step 2 always adds or takes away exactly 2 in every mode', () => {
        for (const [operator, mode] of VALID_PAIRS) {
            for (let i = 0; i < 200; i++) {
                const problem = generateProblem(operator, 10, mode, '2');
                expect(problem.num2).toBe(2);
                expectInvariants(problem, 10, operator);
            }
        }
    });

    it('step 3-5 always adds or takes away 3, 4 or 5 in every mode', () => {
        for (const [operator, mode] of VALID_PAIRS) {
            for (let i = 0; i < 200; i++) {
                const problem = generateProblem(operator, 10, mode, '3-5');
                expect([3, 4, 5]).toContain(problem.num2);
                expectInvariants(problem, 10, operator);
            }
        }
    });

    it('keeps every existing invariant across 1,000 items per pair and step', () => {
        for (const step of STEPS) {
            for (const [operator, mode] of VALID_PAIRS) {
                for (let i = 0; i < 1000; i++) {
                    const problem = generateProblem(operator, 10, mode, step);
                    expectInvariants(problem, 10, operator);
                    const allowed = stepValues(step);
                    if (allowed) {
                        expect(allowed).toContain(problem.num2);
                    }
                }
            }
        }
    });

    it('step any reproduces the legacy generator draw for draw', () => {
        for (const operator of ['+', '-']) {
            const randomLegacy = vi.spyOn(Math, 'random').mockImplementation(seededRandom(42));
            const legacy = Array.from({ length: 50 }, () => (
                operator === '+' ? generateAddition(10) : generateSubtraction(10)
            ));
            randomLegacy.mockRestore();

            const randomStepped = vi.spyOn(Math, 'random').mockImplementation(seededRandom(42));
            const stepped = Array.from({ length: 50 }, () => (
                generateProblem(operator, 10, 'result', 'any')
            ));
            randomStepped.mockRestore();

            const shape = (item) => ({ num1: item.num1, num2: item.num2, answer: item.answer });
            expect(stepped.map(shape)).toEqual(legacy.map(shape));
        }
    });

    it('rejects an unknown step instead of hanging', () => {
        expect(() => generateProblem('+', 10, 'result', 'banana')).toThrow(RangeError);
    });

    it('rejects a step with no candidate below the limit instead of hanging', () => {
        expect(() => generateAddition(2, '3-5')).toThrow(RangeError);
        expect(() => generateSubtraction(2, '3-5')).toThrow(RangeError);
    });
});

describe('preferences step migration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults to any on a fresh install', () => {
        const { wrapper, state } = mountPreferences();
        expect(state.step.value).toBe('any');
        wrapper.unmount();
    });

    it('round-trips a valid step across a reload', () => {
        const first = mountPreferences();
        first.state.setStep('3-5');
        expect(first.state.step.value).toBe('3-5');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).step).toBe('3-5');
        first.wrapper.unmount();

        const { wrapper, state } = mountPreferences();
        expect(state.step.value).toBe('3-5');
        wrapper.unmount();
    });

    it('loads any when an existing install has no step field', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            playerName: 'Sample Player',
            mascot: '🐶',
            maxLimit: 15
        }));

        const { wrapper, state } = mountPreferences();
        expect(state.step.value).toBe('any');
        wrapper.unmount();
    });

    it('writes the migrated default back on the next save', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ maxLimit: 15 }));
        const { wrapper, state } = mountPreferences();

        state.setPlayerName('Sample Player');

        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).step).toBe('any');
        wrapper.unmount();
    });

    it('falls back to any for a corrupt stored step', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 'banana' }));

        const { wrapper, state } = mountPreferences();
        expect(state.step.value).toBe('any');
        wrapper.unmount();
    });

    it('ignores an unknown step passed to setStep', () => {
        const { wrapper, state } = mountPreferences();

        state.setStep('banana');

        expect(state.step.value).toBe('any');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').step).toBeUndefined();
        wrapper.unmount();
    });
});

function reconstructNum2(game) {
    const op = game.operator.value;
    let num1 = Number(game.num1.value);
    let num2 = Number(game.num2.value);
    const answer = Number(game.answer.value);

    if (game.num1.value === '') num1 = op === '+' ? answer - num2 : answer + num2;
    if (game.num2.value === '') num2 = op === '+' ? answer - num1 : num1 - answer;
    return num2;
}

describe('useMathGame step changes', () => {
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

    it('defaults to any and regenerates at the selected step', () => {
        expect(game.step.value).toBe('any');

        game.setStep('1');
        for (let i = 0; i < 30; i++) {
            game.generateNewProblem();
            expect(game.step.value).toBe('1');
            expect(game.mode.value).toBe('result');
            expect(game.num2.value).toBe('1');
        }
    });

    it('cancels a pending advance and generates exactly once at the new step', () => {
        let generations = 0;
        game.setProgressCallback(() => {
            generations++;
        });

        game.setMode('part');
        game.generateNewProblem();
        game.num1.value = '2';
        game.num2.value = '3';
        game.answer.value = '5';
        game.checkAnswer();
        expect(vi.getTimerCount()).toBe(1);

        generations = 0;
        game.setStep('1');

        expect(generations).toBe(1);
        expect(vi.getTimerCount()).toBe(0);
        expect(game.step.value).toBe('1');
        expect(game.mode.value).toBe('part');
        expect(reconstructNum2(game)).toBe(1);
    });

    it('preserves the mode when the step changes and the step when the mode changes', () => {
        game.setMode('part');
        game.setStep('3-5');

        expect(game.mode.value).toBe('part');
        expect(game.step.value).toBe('3-5');

        game.setOperator('-');
        game.setMode('start');
        expect(game.step.value).toBe('3-5');
        expect(game.mode.value).toBe('start');

        for (let i = 0; i < 50; i++) {
            game.generateNewProblem();
            expect(game.mode.value).toBe('start');
            expect([3, 4, 5]).toContain(reconstructNum2(game));
        }
    });

    it('keeps the step through limit and operator changes', () => {
        game.setStep('2');
        game.setMaxLimit(20);
        expect(game.step.value).toBe('2');

        game.setOperator('-');
        expect(game.step.value).toBe('2');

        game.generateNewProblem();
        expect(game.num2.value).toBe('2');
    });

    it('records the step on the per-item log entry', () => {
        game.setStep('2');
        game.generateNewProblem();
        game.num1.value = '1';
        game.num2.value = '2';
        game.answer.value = '3';
        game.checkAnswer();

        expect(game.itemLog.value.at(-1)).toMatchObject({ step: '2' });
    });
});

function openSettings(wrapper) {
    const headerBtns = wrapper.findAll('.header-actions .action-btn');
    return headerBtns[headerBtns.length - 1].trigger('click');
}

describe('App step wiring', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('plays at step any for a fresh install', () => {
        const wrapper = mount(App);
        expect(wrapper.vm.step).toBe('any');
        wrapper.unmount();
    });

    it('offers four step choices in the settings panel with any selected by default', async () => {
        const wrapper = mount(App);
        await openSettings(wrapper);

        const stepButtons = wrapper.findAll('.step-btn');
        expect(stepButtons.map((button) => button.text().toLowerCase())).toEqual(['1', '2', '3-5', 'any']);

        const selected = stepButtons.filter((button) => button.classes('selected'));
        expect(selected.map((button) => button.text().toLowerCase())).toEqual(['any']);
        wrapper.unmount();
    });

    it('changes, persists and applies the step chosen in the settings panel', async () => {
        const wrapper = mount(App);
        await openSettings(wrapper);

        const twoButton = wrapper.findAll('.step-btn').find((button) => button.text() === '2');
        await twoButton.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.step).toBe('2');
        expect(twoButton.classes()).toContain('selected');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).step).toBe('2');

        for (let i = 0; i < 20; i++) {
            wrapper.vm.generateNewProblem();
            expect(wrapper.findAll('.problem input')[1].element.value).toBe('2');
        }
        wrapper.unmount();
    });

    it('shows the stored step as selected when the settings panel opens', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: '3-5' }));

        const wrapper = mount(App);
        await wrapper.vm.$nextTick();
        await openSettings(wrapper);

        const selected = wrapper.findAll('.step-btn').filter((button) => button.classes('selected'));
        expect(selected.map((button) => button.text())).toEqual(['3-5']);
        wrapper.unmount();
    });

    it('loads a stored step and regenerates at that step', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: '1' }));

        const wrapper = mount(App);
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.step).toBe('1');
        expect(wrapper.vm.mode).toBe('result');
        expect(wrapper.findAll('.problem input')[1].element.value).toBe('1');
        wrapper.unmount();
    });

    it('falls back to any when the stored step is corrupt', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 'banana' }));

        const wrapper = mount(App);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.step).toBe('any');
        wrapper.unmount();
    });
});
