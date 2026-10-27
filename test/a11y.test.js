// a11y.test.js — Increment 8: keyboard focus ring and announced feedback.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

const STYLE_PATH = resolve(process.cwd(), 'src/style.css');

function currentSolution(wrapper) {
    const inputs = wrapper.findAll('.problem input');
    const blank = inputs.findIndex((input) => input.element.value === '');
    const op = wrapper.find('.operator').text() === '+' ? '+' : '-';
    const [a, b, c] = inputs.map((input) => (
        input.element.value === '' ? null : Number(input.element.value)
    ));
    const correct = blank === 0
        ? (op === '+' ? c - b : c + b)
        : blank === 1
            ? (op === '+' ? c - a : a - c)
            : (op === '+' ? a + b : a - b);
    return { blank, correct };
}

function focusVisibleRules(css) {
    const rules = [];
    const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
    let match;
    while ((match = rulePattern.exec(css)) !== null) {
        if (/\.touchpad-btn[^,{]*:focus-visible/.test(match[1])) {
            rules.push({ selector: match[1].trim(), body: match[2] });
        }
    }
    return rules;
}

function declaresVisibleRing(body) {
    const value = (name) => {
        const found = new RegExp(`${name}\\s*:\\s*([^;]+)`, 'i').exec(body);
        return found ? found[1].trim() : '';
    };
    const isVisible = (indicator) => indicator !== '' && !/^(none|0(px)?)\b/i.test(indicator);
    return isVisible(value('outline')) ||
        isVisible(value('outline-width')) ||
        isVisible(value('box-shadow'));
}

describe('keypad keyboard focus', () => {
    it('makes every keypad button a focus target', async () => {
        const wrapper = mount(App, { attachTo: document.body });
        const buttons = wrapper.findAll('.touchpad-btn');

        expect(buttons.length).toBeGreaterThan(0);
        for (const button of buttons) {
            button.element.focus();
            expect(document.activeElement).toBe(button.element);
        }
        wrapper.unmount();
    });

    it('draws a visible ring for :focus-visible on the keypad', () => {
        const css = readFileSync(STYLE_PATH, 'utf8');
        const rules = focusVisibleRules(css);

        expect(rules.length).toBeGreaterThan(0);
        expect(rules.some(({ body }) => declaresVisibleRing(body))).toBe(true);
    });
});

describe('feedback announcement', () => {
    it('marks the feedback node as a polite live region and announces a correct answer', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = mount(App);
            const feedback = wrapper.find('#feedback');
            const { correct } = currentSolution(wrapper);

            expect(feedback.attributes('aria-live')).toBe('polite');

            await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.feedback).not.toBe('');
            expect(wrapper.find('#feedback').text()).toBe(wrapper.vm.feedback);
            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('announces a wrong answer through the same live region', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = mount(App);
            const feedback = wrapper.find('#feedback');
            const { correct } = currentSolution(wrapper);
            const wrong = correct === 1 ? 2 : 1;

            expect(feedback.attributes('aria-live')).toBe('polite');

            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.feedback).not.toBe('');
            expect(wrapper.find('#feedback').text()).toBe(wrapper.vm.feedback);
            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });
});
