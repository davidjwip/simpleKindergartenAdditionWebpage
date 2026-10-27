// counters.test.js — Increment 7: countable dot rows under every shown numeral.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import App from '../src/App.vue';
import { usePreferences } from '../src/usePreferences';

const STORAGE_KEY = 'mathGame.preferences';

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

async function mountApp(prefs = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    return wrapper;
}

function filledDots(row) {
    return row.findAll('.dot.filled').length;
}

function numeralRows(wrapper) {
    return wrapper.findAll('.numeral-counters .dot-row');
}

function shownFields(wrapper) {
    return wrapper.findAll('.problem input').map((input) => (
        input.element.value === '' ? null : Number(input.element.value)
    ));
}

function correctValueFromApp(wrapper) {
    const [a, b, c] = shownFields(wrapper);
    const operator = wrapper.find('.operator').text() === '+' ? '+' : '-';
    const blank = wrapper.findAll('.problem input').findIndex(
        (input) => input.element.value === ''
    );
    if (blank === 0) return operator === '+' ? c - b : c + b;
    if (blank === 1) return operator === '+' ? c - a : a - c;
    return operator === '+' ? a + b : a - b;
}

async function openSettings(wrapper) {
    const headerBtns = wrapper.findAll('.header-actions .action-btn');
    await headerBtns[headerBtns.length - 1].trigger('click');
    return wrapper.find('.settings-panel');
}

describe('counters preference', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults off and round-trips the adult toggle', () => {
        const first = mountPreferences();

        expect(first.state.countersOn.value).toBe(false);

        first.state.setCountersOn(true);

        expect(first.state.countersOn.value).toBe(true);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).countersOn).toBe(true);
        first.wrapper.unmount();

        const second = mountPreferences();

        expect(second.state.countersOn.value).toBe(true);
        second.wrapper.unmount();
    });

    it('treats absent or non-true stored counters as off', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ maxLimit: 10 }));
        const absent = mountPreferences();
        expect(absent.state.countersOn.value).toBe(false);
        absent.wrapper.unmount();

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ countersOn: 'yes' }));
        const corrupt = mountPreferences();
        expect(corrupt.state.countersOn.value).toBe(false);
        corrupt.wrapper.unmount();
    });
});

describe('App counters', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('persists the settings toggle and restores counters on reload', async () => {
        const wrapper = mount(App);
        const settings = await openSettings(wrapper);
        const checkbox = settings.find('.counters-toggle input[type="checkbox"]');

        expect(checkbox.exists()).toBe(true);
        expect(checkbox.element.checked).toBe(false);
        expect(wrapper.find('.numeral-counters').exists()).toBe(false);

        await checkbox.setValue(true);
        await wrapper.vm.$nextTick();

        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).countersOn).toBe(true);
        expect(wrapper.findAll('.numeral-counters .dot-row').length).toBeGreaterThan(0);
        wrapper.unmount();

        const reloaded = mount(App);
        await reloaded.vm.$nextTick();
        await reloaded.vm.$nextTick();

        expect(reloaded.findAll('.numeral-counters .dot-row').length).toBeGreaterThan(0);
        const reloadedSettings = await openSettings(reloaded);
        expect(
            reloadedSettings.find('.counters-toggle input[type="checkbox"]').element.checked
        ).toBe(true);
        reloaded.unmount();
    });

    it.each(['+', '-'])(
        'renders a matching countable row under each visible numeral in result mode (%s)',
        async (operator) => {
            const wrapper = await mountApp({ mode: 'result', countersOn: true, maxLimit: 10 });

            if (operator === '-') {
                await wrapper.find('.operator-toggle button:last-child').trigger('click');
                await wrapper.vm.$nextTick();
            }

            for (let i = 0; i < 20; i++) {
                wrapper.vm.generateNewProblem();
                await wrapper.vm.$nextTick();

                const rows = numeralRows(wrapper);
                const visible = shownFields(wrapper).filter((value) => value !== null);

                expect(visible).toHaveLength(2);
                expect(rows).toHaveLength(visible.length);
                expect(rows.map(filledDots)).toEqual(visible);
                expect(rows.map((row) => Number(row.attributes('data-total')))).toEqual(visible);
                expect(rows.map((row) => row.attributes('data-counter-for'))).toEqual(['num1', 'num2']);
            }

            wrapper.unmount();
        }
    );

    it('counts every visible numeral in part mode when counters are on', async () => {
        const wrapper = await mountApp({ mode: 'part', countersOn: true, maxLimit: 10 });

        expect(wrapper.vm.mode).toBe('part');

        for (let i = 0; i < 20; i++) {
            wrapper.vm.generateNewProblem();
            await wrapper.vm.$nextTick();

            const rows = numeralRows(wrapper);
            const visible = shownFields(wrapper).filter((value) => value !== null);
            const visibleFields = ['num1', 'num2', 'answer'].filter(
                (field) => wrapper.vm[field] !== ''
            );

            expect(visible).toHaveLength(2);
            expect(rows.map(filledDots)).toEqual(visible);
            expect(rows.map((row) => row.attributes('data-counter-for'))).toEqual(visibleFields);
        }

        wrapper.unmount();
    });

    it('renders no dots and leaves the equation and keypad untouched when counters are off', async () => {
        const wrapper = await mountApp({ mode: 'result', countersOn: false });

        expect(wrapper.find('.dot-row').exists()).toBe(false);
        expect(wrapper.find('.numeral-counters').exists()).toBe(false);
        expect(wrapper.findAll('.problem input')).toHaveLength(3);
        expect(
            wrapper.findAll('.problem input').map((input) => input.attributes('placeholder'))
        ).toEqual(['?', '?', '?']);
        expect(wrapper.findAll('.touchpad-btn')).toHaveLength(10);

        wrapper.unmount();
    });

    it('does not change the keypad path when counters are on', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountApp({ mode: 'result', countersOn: true, maxLimit: 10 });
            const correct = correctValueFromApp(wrapper);

            expect(correct).toBeGreaterThanOrEqual(1);
            expect(wrapper.findAll('.touchpad-btn')).toHaveLength(10);
            expect(numeralRows(wrapper)).toHaveLength(2);

            await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.problemsSolved).toBe(1);
            expect(wrapper.vm.lastResult).toBe('correct');

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });
});
