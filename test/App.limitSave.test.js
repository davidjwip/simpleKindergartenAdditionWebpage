// App.limitSave.test.js — a limit save must generate exactly one new item.
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const spies = vi.hoisted(() => ({
    generateNewProblem: null,
    setMaxLimit: null
}));

vi.mock('../src/useMathGame', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useMathGame() {
            const game = actual.useMathGame();
            spies.generateNewProblem = vi.fn(game.generateNewProblem);
            spies.setMaxLimit = vi.fn(game.setMaxLimit);
            game.generateNewProblem = spies.generateNewProblem;
            game.setMaxLimit = spies.setMaxLimit;
            return game;
        }
    };
});

import App from '../src/App.vue';

describe('App limit save', () => {
    it('generates exactly one new item when a limit is saved', async () => {
        const wrapper = mount(App);
        await wrapper.vm.$nextTick();

        spies.generateNewProblem.mockClear();
        spies.setMaxLimit.mockClear();

        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];
        await limitBtn.trigger('click');
        await wrapper.find('input[type="number"]').setValue(20);
        await wrapper.find('.limit-actions .action-btn:last-child').trigger('click');
        await wrapper.vm.$nextTick();

        const generations =
            spies.generateNewProblem.mock.calls.length + spies.setMaxLimit.mock.calls.length;
        expect(generations).toBe(1);
        expect(wrapper.findAll('.touchpad-btn').length).toBe(20);
        wrapper.unmount();
    });

    it('generates exactly one new item when the same limit is saved', async () => {
        const wrapper = mount(App);
        await wrapper.vm.$nextTick();

        spies.generateNewProblem.mockClear();
        spies.setMaxLimit.mockClear();

        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];
        await limitBtn.trigger('click');
        await wrapper.find('input[type="number"]').setValue(10);
        await wrapper.find('.limit-actions .action-btn:last-child').trigger('click');
        await wrapper.vm.$nextTick();

        const generations =
            spies.generateNewProblem.mock.calls.length + spies.setMaxLimit.mock.calls.length;
        expect(generations).toBe(1);
        wrapper.unmount();
    });
});
