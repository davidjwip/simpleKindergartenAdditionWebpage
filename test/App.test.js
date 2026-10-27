// App.test.js — mount-level tests for the rendered component.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

function currentSolution(wrapper) {
    const inputs = wrapper.findAll('.problem input');
    const blank = inputs.findIndex((input) => input.element.value === '');
    const op = wrapper.find('.operator').text() === '+' ? '+' : '-';
    const [a, b, c] = inputs.map((input) => (input.element.value === '' ? null : Number(input.element.value)));
    const correct = blank === 0
        ? (op === '+' ? c - b : c + b)
        : blank === 1
            ? (op === '+' ? c - a : a - c)
            : (op === '+' ? a + b : a - b);
    return { blank, correct };
}

describe('App.vue', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    it('renders the header and a default 10-button touchpad', () => {
        const wrapper = mount(App);
        expect(wrapper.text()).toContain('Fun Math for Kids!');
        expect(wrapper.findAll('.touchpad-btn').length).toBe(10);
        wrapper.unmount();
    });

    it('grows the touchpad to 20 buttons when limit is changed via popup', async () => {
        const wrapper = mount(App);
        // Open limit popup (4th button in header-actions: How to Use, +, −, Limit)
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        expect(headerBtns.length).toBe(6);
        const limitBtn = headerBtns[3]; // 4th button is limit
        expect(limitBtn.text()).toBe('🔢 Limit: 10');
        await limitBtn.trigger('click');
        
        // Verify popup exists
        const limitPopup = wrapper.find('.limit-popup');
        expect(limitPopup.exists()).toBe(true);
        
        // Set to 20 via input
        const input = wrapper.find('input[type="number"]');
        await input.setValue(20);
        await wrapper.find('.limit-actions .action-btn:last-child').trigger('click');
        
        expect(wrapper.findAll('.touchpad-btn').length).toBe(20);
        
        // Set back to 10
        await limitBtn.trigger('click');
        await input.setValue(10);
        await wrapper.find('.limit-actions .action-btn:last-child').trigger('click');
        
        expect(wrapper.findAll('.touchpad-btn').length).toBe(10);
        wrapper.unmount();
    });

    it('renders a 1..10 keypad when the stored limit is corrupt', () => {
        localStorage.setItem('mathGame.preferences', JSON.stringify({ maxLimit: 'corrupt' }));

        const wrapper = mount(App);

        const buttons = wrapper.findAll('.touchpad-btn');
        expect(buttons.length).toBe(10);
        expect(buttons[9].text()).toBe('10');
        wrapper.unmount();
    });

    it('fills the first empty field when a touchpad button is clicked', async () => {
        const wrapper = mount(App);
        const inputs = wrapper.findAll('.problem input');
        expect(inputs.length).toBe(3);

        // Locate the single blank field the initial problem leaves open.
        const emptyIndex = inputs.findIndex((i) => i.element.value === '');
        expect(emptyIndex).toBeGreaterThanOrEqual(0);

        const pickedButton = 1;
        await wrapper.findAll('.touchpad-btn')[pickedButton - 1].trigger('click');

        const inputsAfter = wrapper.findAll('.problem input');
        expect(inputsAfter[emptyIndex].element.value).toBe(String(pickedButton));
        wrapper.unmount();
    });

    it('shows a "?" placeholder on every input so any blank box is indicated', () => {
        const wrapper = mount(App);
        const inputs = wrapper.findAll('.problem input');
        // All three fields (num1, num2, answer) carry the placeholder,
        // so the missing value is visually flagged regardless of position.
        inputs.forEach((input) => {
            expect(input.attributes('placeholder')).toBe('?');
        });
        wrapper.unmount();
    });

    it('renders the goal track with 10 steps', () => {
        const wrapper = mount(App);
        const steps = wrapper.findAll('.step');
        expect(steps.length).toBe(10);
        wrapper.unmount();
    });

    it('shows session counts without an accuracy fraction', () => {
        const wrapper = mount(App);

        expect(wrapper.find('.session-counts').exists()).toBe(true);
        expect(wrapper.find('.solved-count').text()).toBe('Solved: 0');
        expect(wrapper.find('.tried-count').text()).toBe('Tried: 0');
        expect(wrapper.find('.progress-area').text()).not.toContain('/');
        wrapper.unmount();
    });

    it('lights step 10 when ten problems are solved', async () => {
        const wrapper = mount(App);

        wrapper.vm.problemsSolved = 10;
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.step')[9].classes()).toContain('filled');
        wrapper.unmount();
    });

    it('shows the settings panel toggle button', () => {
        const wrapper = mount(App);
        // The settings button should be in the header (last button now)
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        expect(headerBtns.length).toBe(6); // How to Use, +, −, Limit, Mute, Settings
        const settingsBtn = headerBtns[headerBtns.length - 1];
        expect(settingsBtn.exists()).toBe(true);
        // The owner asked for the word, not the person icon: the panel is where tasks are set.
        expect(settingsBtn.text()).toBe('Options');
        wrapper.unmount();
    });

    it('shows settings panel when toggle is clicked', async () => {
        const wrapper = mount(App);
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        const settingsBtn = headerBtns[headerBtns.length - 1];
        await settingsBtn.trigger('click');

        const settingsPanel = wrapper.find('.settings-panel');
        expect(settingsPanel.exists()).toBe(true);
        expect(settingsPanel.find('input[type="text"]').exists()).toBe(true);
        expect(settingsPanel.find('.mascot-options').exists()).toBe(true);
        wrapper.unmount();
    });

    it('saves player name and updates header', async () => {
        const wrapper = mount(App);
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        const settingsBtn = headerBtns[headerBtns.length - 1];
        await settingsBtn.trigger('click');

        const nameInput = wrapper.find('input[type="text"]');
        await nameInput.setValue('George');

        const saveBtn = wrapper.find('.settings-content .action-btn:last-child');
        await saveBtn.trigger('click');

        // Settings panel should close
        expect(wrapper.find('.settings-panel').exists()).toBe(false);

        // Header should show the name
        expect(wrapper.find('h1').text()).toContain('George');
        wrapper.unmount();
    });

    it('selects mascot from picker', async () => {
        const wrapper = mount(App);
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        const settingsBtn = headerBtns[headerBtns.length - 1];
        await settingsBtn.trigger('click');

        // Find all mascot buttons
        const mascotBtns = wrapper.findAll('.mascot-btn');
        expect(mascotBtns.length).toBe(8);
        
        // The cat button is at index 1
        const catBtn = mascotBtns[1];
        
        // Check that cat is NOT selected initially
        expect(catBtn.classes('selected')).toBe(false);
        
        // Store the button text for reference
        const catEmoji = catBtn.text();
        
        await catBtn.trigger('click'); // select cat
        
        // Picking a mascot no longer dismisses the panel: Options holds task, step and counters too,
        // so closing on a mascot tap sent the adult back to the game mid-setup.
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.settings-panel').exists()).toBe(true);
        expect(wrapper.vm.mascot).toBe(catEmoji);
        wrapper.unmount();
    });

    it('toggles mute button and shows correct icon', async () => {
        const wrapper = mount(App);
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        const muteBtn = headerBtns.find(btn => btn.text() === '🔊');

        expect(muteBtn.exists()).toBe(true);
        expect(muteBtn.text()).toBe('🔊');

        await muteBtn.trigger('click');
        expect(muteBtn.text()).toBe('🔇');

        await muteBtn.trigger('click');
        expect(muteBtn.text()).toBe('🔊');
        wrapper.unmount();
    });

    it('shows mute button exists in header', () => {
        const wrapper = mount(App);
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        const muteBtn = headerBtns.find(btn => btn.text() === '🔊');
        expect(muteBtn.exists()).toBe(true);
        wrapper.unmount();
    });

    it('operator toggle in header shows both + and - buttons', () => {
        const wrapper = mount(App);
        const operatorToggle = wrapper.find('.operator-toggle');
        expect(operatorToggle.exists()).toBe(true);

        const plusBtn = operatorToggle.find('button:first-child');
        const minusBtn = operatorToggle.find('button:last-child');

        expect(plusBtn.exists()).toBe(true);
        expect(plusBtn.text()).toBe('+');
        expect(minusBtn.exists()).toBe(true);
        expect(minusBtn.text()).toBe('−');
        wrapper.unmount();
    });

    it('operator toggle switches between + and -', async () => {
        const wrapper = mount(App);
        const operatorToggle = wrapper.find('.operator-toggle');
        const minusBtn = operatorToggle.find('button:last-child');

        // Start with addition (+)
        expect(wrapper.find('.operator').text()).toBe('+');

        await minusBtn.trigger('click');

        // Should switch to subtraction (−)
        expect(wrapper.find('.operator').text()).toBe('−');
        wrapper.unmount();
    });

    it('reveals the completed equation and highlights the revealed blank', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = mount(App);
            const inputs = wrapper.findAll('.problem input');
            const blank = inputs.findIndex((input) => input.element.value === '');
            const op = wrapper.find('.operator').text() === '+' ? '+' : '-';
            const [a, b, c] = inputs.map((input) => (input.element.value === '' ? null : Number(input.element.value)));
            const correct = blank === 0
                ? (op === '+' ? c - b : c + b)
                : blank === 1
                    ? (op === '+' ? c - a : a - c)
                    : (op === '+' ? a + b : a - b);
            const wrong = correct === 1 ? 2 : 1;

            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            vi.advanceTimersByTime(1500);
            await wrapper.vm.$nextTick();
            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            await wrapper.vm.$nextTick();

            const revealed = wrapper.findAll('.problem input')[blank];
            expect(revealed.element.value).toBe(String(correct));
            expect(revealed.classes()).toContain('reveal-highlight');
            expect(wrapper.find('#feedback').text()).not.toBe('');
            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('toggles the how-to-use instructions panel', async () => {
        const wrapper = mount(App);
        const instructionsBtn = wrapper.findAll('.header-actions .action-btn')[0];

        expect(wrapper.find('.instructions-panel').exists()).toBe(false);
        await instructionsBtn.trigger('click');
        expect(wrapper.find('.instructions-panel').exists()).toBe(true);
        expect(instructionsBtn.text()).toBe('Close');

        await instructionsBtn.trigger('click');
        expect(wrapper.find('.instructions-panel').exists()).toBe(false);
        wrapper.unmount();
    });

    it('offers every limit preset in the popup', async () => {
        const wrapper = mount(App);
        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];
        await limitBtn.trigger('click');

        const presets = wrapper.findAll('.limit-preset-btn');
        expect(presets.map((preset) => preset.text())).toEqual(['5', '10', '15', '20']);

        for (const preset of presets) {
            await preset.trigger('click');
            expect(wrapper.find('input[type="number"]').element.value).toBe(preset.text());
        }
        wrapper.unmount();
    });

    it('cancels a limit change without altering the keypad', async () => {
        const wrapper = mount(App);
        const limitBtn = wrapper.findAll('.header-actions .action-btn')[3];
        await limitBtn.trigger('click');

        const input = wrapper.find('input[type="number"]');
        await input.setValue(20);
        await wrapper.find('.limit-actions .action-btn:first-child').trigger('click');

        expect(wrapper.find('.limit-popup').exists()).toBe(false);
        expect(wrapper.findAll('.touchpad-btn').length).toBe(10);
        wrapper.unmount();
    });

    it('exposes the header operator computed as a read/write bridge', async () => {
        const wrapper = mount(App);

        expect(wrapper.vm.headerOperator).toBe('+');
        wrapper.vm.headerOperator = '-';
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.operator').text()).toBe('−');
        wrapper.unmount();
    });

    it('opens the celebration with no pending advance timer or hidden new item', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = mount(App);
            const vm = wrapper.vm;
            vm.problemsSolved = 9;
            vm.totalProblems = 9;

            const { blank, correct } = currentSolution(wrapper);
            expect(blank).toBeGreaterThanOrEqual(0);

            await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
            await wrapper.vm.$nextTick();

            expect(vm.celebrationVisible).toBe(true);
            expect(wrapper.findAll('.step')[9].classes()).toContain('filled');
            expect(vi.getTimerCount()).toBe(0);

            const before = wrapper.findAll('.problem input').map((input) => input.element.value);
            vi.advanceTimersByTime(2000);
            await wrapper.vm.$nextTick();
            const after = wrapper.findAll('.problem input').map((input) => input.element.value);
            expect(after).toEqual(before);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('celebrates ten answers solved end to end in part mode', async () => {
        vi.useFakeTimers();
        try {
            localStorage.setItem('mathGame.preferences', JSON.stringify({ mode: 'part' }));
            const wrapper = mount(App);
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.mode).toBe('part');

            for (let i = 0; i < 10; i++) {
                const { blank, correct } = currentSolution(wrapper);
                expect(blank).toBeGreaterThanOrEqual(0);
                expect(correct).toBeGreaterThanOrEqual(1);

                await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.problemsSolved).toBe(i + 1);

                if (i < 9) {
                    vi.advanceTimersByTime(2000);
                    await wrapper.vm.$nextTick();
                }
            }

            expect(wrapper.vm.problemsSolved).toBe(10);
            expect(wrapper.vm.celebrationVisible).toBe(true);
            expect(wrapper.find('.celebration-overlay').classes('visible')).toBe(true);
            expect(wrapper.find('.celebration-content').text()).toContain(
                'You solved 10 problems correctly!'
            );
            expect(vi.getTimerCount()).toBe(0);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('shows celebration overlay when reaching 10 solved problems', async () => {
        const wrapper = mount(App);

        // Force show the celebration
        const vm = wrapper.vm;
        vm.celebrationVisible = true;

        await wrapper.vm.$nextTick();

        const celebration = wrapper.find('.celebration-overlay');
        expect(celebration.classes('visible')).toBe(true);
        expect(celebration.text()).toContain('Amazing Job!');
        wrapper.unmount();
    });

    it('closes celebration overlay and resets progress', async () => {
        const wrapper = mount(App);

        const vm = wrapper.vm;
        vm.celebrationVisible = true;
        vm.problemsSolved = 10;

        await wrapper.vm.$nextTick();

        const closeBtn = wrapper.find('.celebration-close-btn');
        await closeBtn.trigger('click');

        // Overlay should hide
        expect(wrapper.find('.celebration-overlay').classes('visible')).toBe(false);

        // Verify progress reset after timeout
        await new Promise(resolve => setTimeout(resolve, 600));
        expect(vm.problemsSolved).toBe(0);
        wrapper.unmount();
    });
});
describe('adult panels dismiss themselves', () => {
    it('closes the Options panel on a pointer-down outside it', async () => {
        const wrapper = mount(App);
        await wrapper.find('.options-btn').trigger('click');
        expect(wrapper.find('.settings-panel').exists()).toBe(true);

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.settings-panel').exists()).toBe(false);
        wrapper.unmount();
    });

    it('keeps the Options panel open when the pointer-down is inside it', async () => {
        const wrapper = mount(App);
        await wrapper.find('.options-btn').trigger('click');

        wrapper.find('.settings-panel').element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.settings-panel').exists()).toBe(true);
        wrapper.unmount();
    });

    it('closes the limit popup on a pointer-down outside it', async () => {
        const wrapper = mount(App);
        const limitButton = wrapper.findAll('button').find((b) => b.text().includes('Limit'));
        await limitButton.trigger('click');
        expect(wrapper.find('.limit-popup').exists()).toBe(true);

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.limit-popup').exists()).toBe(false);
        wrapper.unmount();
    });

    it('closes both panels on Escape and ignores other keys', async () => {
        const wrapper = mount(App);
        await wrapper.find('.options-btn').trigger('click');
        const limitButton = wrapper.findAll('button').find((b) => b.text().includes('Limit'));
        await limitButton.trigger('click');
        expect(wrapper.find('.settings-panel').exists()).toBe(true);
        expect(wrapper.find('.limit-popup').exists()).toBe(true);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.settings-panel').exists()).toBe(true);
        expect(wrapper.find('.limit-popup').exists()).toBe(true);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.settings-panel').exists()).toBe(false);
        expect(wrapper.find('.limit-popup').exists()).toBe(false);
        wrapper.unmount();
    });

    it('does not close a panel when the pointer-down is on the button that opens it', async () => {
        const wrapper = mount(App);
        await wrapper.find('.options-btn').trigger('click');

        // A pointer-down on the toggle must be ignored by the document listener, otherwise the
        // click that follows re-opens what the pointerdown just closed.
        wrapper.find('.options-btn').element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.settings-panel').exists()).toBe(true);

        const limitButton = wrapper.findAll('button').find((b) => b.text().includes('Limit'));
        await limitButton.trigger('click');
        limitButton.element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.limit-popup').exists()).toBe(true);
        wrapper.unmount();
    });

    it('toggles the limit popup shut when its own button is pressed again', async () => {
        const wrapper = mount(App);
        const limitButton = wrapper.findAll('button').find((b) => b.text().includes('Limit'));

        await limitButton.trigger('click');
        expect(wrapper.find('.limit-popup').exists()).toBe(true);

        await limitButton.trigger('click');
        expect(wrapper.find('.limit-popup').exists()).toBe(false);
        wrapper.unmount();
    });

    it('names every task the picker offers in the how-to-use text', async () => {
        const wrapper = mount(App);
        await wrapper.find('.options-btn').trigger('click');
        const labels = wrapper.findAll('.mode-btn').map((b) => b.text());
        expect(labels.length).toBeGreaterThan(0);
        await wrapper.find('.options-btn').trigger('click');

        const howTo = wrapper.findAll('button').find((b) => b.text() === 'How to Use');
        await howTo.trigger('click');
        const text = wrapper.find('.instructions-panel').text();

        // The copy is the thing the owner asked to be honest, so it is pinned to the picker: adding a
        // task without documenting it fails here.
        for (const label of labels) {
            expect(text).toContain(label);
        }
        expect(text.toLowerCase()).toContain('one more try');
        expect(text.toLowerCase()).toMatch(/ten correct answers|one pass/);
        // the start-mode cap is stated where the adult sets the limit, so the copy says it too
        expect(text.toLowerCase()).toContain('stops at 10');
        wrapper.unmount();
    });

    it('re-opening the limit frame shows the saved limit, not an abandoned draft', async () => {
        const wrapper = mount(App);
        const limitButton = wrapper.findAll('button').find((b) => b.text().includes('Limit'));

        await limitButton.trigger('click');
        const input = wrapper.find('.limit-popup-content input[type="number"]');
        const saved = input.element.value;
        await input.setValue('17');

        // dismissed without saving: an outside pointer-down, not the Save button
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.limit-popup').exists()).toBe(false);

        await limitButton.trigger('click');
        const reopened = wrapper.find('.limit-popup-content input[type="number"]');
        expect(reopened.element.value).toBe(saved);
        expect(reopened.element.value).not.toBe('17');
        wrapper.unmount();
    });

    it('discards an abandoned name draft when the Options panel closes', async () => {
        const wrapper = mount(App);
        await wrapper.find('.options-btn').trigger('click');
        const nameInput = wrapper.find('.settings-panel input[type="text"]');
        await nameInput.setValue('Half-typed');

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.settings-panel').exists()).toBe(false);

        await wrapper.find('.options-btn').trigger('click');
        expect(wrapper.find('.settings-panel input[type="text"]').element.value).toBe('');
        wrapper.unmount();
    });
});
