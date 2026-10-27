// modeResult.test.js — Increment 3: result-unknown is the default task.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { generateProblem } from '../src/mathEngine';
import { useMathGame } from '../src/useMathGame';
import { usePreferences } from '../src/usePreferences';
import App from '../src/App.vue';

const STORAGE_KEY = 'mathGame.preferences';
const ITEM_SHAPE_KEYS = ['answer', 'blankField', 'mode', 'num1', 'num2', 'operator'].sort();

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

function problemFields(wrapper) {
    return wrapper.findAll('.problem input').map((input) => input.element.value);
}

function expectResultOnly(wrapper) {
    const [a, b, c] = problemFields(wrapper);
    expect(a).not.toBe('');
    expect(b).not.toBe('');
    expect(c).toBe('');
}

describe('generateProblem in result mode', () => {
    it('returns the documented item shape', () => {
        const problem = generateProblem('+', 10, 'result');

        expect(Object.keys(problem).sort()).toEqual(ITEM_SHAPE_KEYS);
        expect(problem.mode).toBe('result');
        expect(problem.operator).toBe('+');
        expect(problem.blankField).toBe('answer');
    });

    it('blanks the answer for 200 items across both operators and keeps every invariant', () => {
        const operators = ['+', '+', '-', '-'];
        let count = 0;

        for (let i = 0; i < 200; i++) {
            const operator = operators[i % operators.length];
            const problem = generateProblem(operator, 10, 'result');
            count++;

            expect(problem.blankField).toBe('answer');
            expect(problem.mode).toBe('result');
            expect(problem.operator).toBe(operator);
            expect(problem.num1).toBeGreaterThanOrEqual(1);
            expect(problem.num2).toBeGreaterThanOrEqual(1);
            expect(problem.num1).toBeLessThanOrEqual(10);
            expect(problem.num2).toBeLessThanOrEqual(10);
            expect(problem.answer).toBeGreaterThanOrEqual(1);
            expect(problem.answer).toBeLessThanOrEqual(10);

            if (operator === '+') {
                expect(problem.answer).toBe(problem.num1 + problem.num2);
            } else {
                expect(problem.num1).toBeGreaterThan(problem.num2);
                expect(problem.answer).toBe(problem.num1 - problem.num2);
            }
        }

        expect(count).toBe(200);
    });

    it('stubs operand modes without making them the default', () => {
        for (let i = 0; i < 50; i++) {
            expect(['num1', 'num2']).toContain(generateProblem('+', 10, 'part').blankField);
            expect(generateProblem('-', 10, 'part').blankField).toBe('num2');
            expect(generateProblem('-', 10, 'start').blankField).toBe('num1');
        }
    });

    it('refuses the start mode under addition', () => {
        expect(() => generateProblem('+', 10, 'start')).toThrow(RangeError);
    });
});

describe('useMathGame result mode', () => {
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

    it('defaults to result and never leaves an operand blank', () => {
        expect(game.mode.value).toBe('result');

        for (let i = 0; i < 100; i++) {
            game.generateNewProblem();
            expect(game.blankField.value).toBe('answer');
            expect(game.num1.value).not.toBe('');
            expect(game.num2.value).not.toBe('');
            expect(game.answer.value).toBe('');
        }
    });

    it('regenerates the item when the mode changes', () => {
        game.generateNewProblem();
        expect(game.blankField.value).toBe('answer');

        game.setMode('part');

        expect(game.mode.value).toBe('part');
        expect(['num1', 'num2']).toContain(game.blankField.value);
        expect(game.answer.value).not.toBe('');
    });

    it('clears a pending advance timer and generates one item on a mode change', () => {
        let generations = 0;
        game.setProgressCallback(() => {
            generations++;
        });

        game.generateNewProblem();
        game.num1.value = '2';
        game.num2.value = '3';
        game.answer.value = '5';
        game.checkAnswer();
        expect(vi.getTimerCount()).toBe(1);

        generations = 0;
        game.setMode('part');

        expect(generations).toBe(1);
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('preferences mode migration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('loads result when an existing install has no mode field', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            playerName: 'Sample Player',
            mascot: '🐶',
            maxLimit: 15
        }));

        const { wrapper, state } = mountPreferences();

        expect(state.mode.value).toBe('result');
        wrapper.unmount();
    });

    it('writes the migrated default back on the next save', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ maxLimit: 15 }));
        const { wrapper, state } = mountPreferences();

        state.setPlayerName('Sample Player');

        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).mode).toBe('result');
        wrapper.unmount();
    });

    it('persists a valid mode across a reload', () => {
        const first = mountPreferences();
        first.state.setMode('part');
        expect(first.state.mode.value).toBe('part');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).mode).toBe('part');
        first.wrapper.unmount();

        const { wrapper, state } = mountPreferences();
        expect(state.mode.value).toBe('part');
        wrapper.unmount();
    });

    it('ignores an unknown mode passed to setMode', () => {
        const { wrapper, state } = mountPreferences();

        state.setMode('banana');

        expect(state.mode.value).toBe('result');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').mode).toBeUndefined();
        wrapper.unmount();
    });

    it('falls back to result for a corrupt stored mode', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'banana' }));

        const { wrapper, state } = mountPreferences();

        expect(state.mode.value).toBe('result');
        wrapper.unmount();
    });
});

describe('App default task', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('shows only result-unknown items for a fresh install, with both operators', async () => {
        const wrapper = mount(App);
        expect(wrapper.vm.mode).toBe('result');

        expectResultOnly(wrapper);
        for (let i = 0; i < 100; i++) {
            wrapper.vm.generateNewProblem();
            expectResultOnly(wrapper);
        }

        await wrapper.find('.operator-toggle button:last-child').trigger('click');
        expectResultOnly(wrapper);
        for (let i = 0; i < 100; i++) {
            wrapper.vm.generateNewProblem();
            expectResultOnly(wrapper);
        }

        wrapper.unmount();
    });

    it('plays result mode for an existing install whose preferences have no mode', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ maxLimit: 15 }));

        const wrapper = mount(App);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.mode).toBe('result');
        expectResultOnly(wrapper);
        expect(wrapper.findAll('.touchpad-btn').length).toBe(15);
        wrapper.unmount();
    });

    it('plays result mode when the stored mode is corrupt', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'banana' }));

        const wrapper = mount(App);

        expect(wrapper.vm.mode).toBe('result');
        expectResultOnly(wrapper);
        wrapper.unmount();
    });
});
