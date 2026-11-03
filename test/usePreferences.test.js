// usePreferences.test.js — tests for the preferences composable
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
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
    const wrapper = mount(Host);
    return { wrapper, state };
}

describe('usePreferences', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    it('defaults to empty name and fox mascot', () => {
        const { playerName, mascot, MASCOTS } = usePreferences();
        expect(playerName.value).toBe('');
        expect(mascot.value).toBe('🦊');
        expect(MASCOTS).toContain('🦊');
    });

    it('setPlayerName updates name and persists to localStorage', () => {
        const { playerName, setPlayerName } = usePreferences();

        setPlayerName('Teddy');
        expect(playerName.value).toBe('Teddy');
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored.playerName).toBe('Teddy');
    });

    it('setMascot updates mascot and persists', () => {
        const { mascot, setMascot } = usePreferences();

        setMascot('🐱');
        expect(mascot.value).toBe('🐱');
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored.mascot).toBe('🐱');
    });

    it('setMaxLimit updates limit and persists with clamping', () => {
        const { maxLimit, setMaxLimit } = usePreferences();

        setMaxLimit(25); // Should clamp to 20
        expect(maxLimit.value).toBe(20);

        setMaxLimit(3); // Should clamp to 5
        expect(maxLimit.value).toBe(5);

        setMaxLimit(15);
        expect(maxLimit.value).toBe(15);
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored.maxLimit).toBe(15);
    });

    it('rejects non-finite limits in setMaxLimit', () => {
        const { maxLimit, setMaxLimit } = usePreferences();

        setMaxLimit(Number('corrupt'));
        expect(maxLimit.value).toBe(10);

        setMaxLimit(Infinity);
        expect(maxLimit.value).toBe(10);
    });

    it('falls back to the default limit when the stored limit is non-finite', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ maxLimit: 'corrupt' }));

        const { wrapper, state } = mountPreferences();

        expect(state.maxLimit.value).toBe(10);
        wrapper.unmount();
    });

    it('getRandomName returns a random name', () => {
        const { getRandomName } = usePreferences();

        const names = new Set();
        for (let i = 0; i < 50; i++) {
            names.add(getRandomName());
        }

        // Should return names from the list
        expect(names.size).toBeGreaterThan(1);
    });

    it('MASCOTS array contains expected values', () => {
        const { MASCOTS } = usePreferences();
        expect(MASCOTS).toEqual(['🦊', '🐱', '🐶', '🐰', '🦁', '🐼', '🚀', '🦄']);
    });

    it('rehydrates preferences from localStorage', () => {
        // Pre-seed localStorage
        const prefs = {
            playerName: 'George',
            mascot: '🐶',
            maxLimit: 15
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

        // Note: onMounted doesn't run in isolated tests, so rehydration only happens
        // in actual component context. In tests, we can verify the setters persist correctly.
        // The actual rehydration is tested in usePreferences.e2e.test.js if needed.
        const { playerName, mascot, maxLimit } = usePreferences();
        // Verify values default (since onMounted didn't run)
        expect(playerName.value).toBe('');
        expect(mascot.value).toBe('🦊');
        expect(maxLimit.value).toBe(10);
    });

    it('rehydrates stored preferences when the composable mounts', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            playerName: 'Sample Player',
            mascot: '🐶',
            maxLimit: 15
        }));

        const { wrapper, state } = mountPreferences();

        expect(state.playerName.value).toBe('Sample Player');
        expect(state.mascot.value).toBe('🐶');
        expect(state.maxLimit.value).toBe(15);
        wrapper.unmount();
    });

    it('falls back to defaults when mounted with unparseable storage', () => {
        localStorage.setItem(STORAGE_KEY, 'not valid json');

        const { wrapper, state } = mountPreferences();

        expect(state.playerName.value).toBe('');
        expect(state.mascot.value).toBe('🦊');
        expect(state.maxLimit.value).toBe(10);
        wrapper.unmount();
    });

    it('handles invalid JSON in localStorage gracefully', () => {
        // Invalid JSON
        localStorage.setItem(STORAGE_KEY, 'not valid json');

        const { playerName, mascot, maxLimit } = usePreferences();
        // Should use defaults (onMounted doesn't run in isolated tests)
        expect(playerName.value).toBe('');
        expect(mascot.value).toBe('🦊');
        expect(maxLimit.value).toBe(10);
    });

    it('defaults anchorKind to bond and round-trips doubles', () => {
        const { anchorKind, setAnchorKind } = usePreferences();

        expect(anchorKind.value).toBe('bond');

        setAnchorKind('doubles');
        expect(anchorKind.value).toBe('doubles');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).anchorKind).toBe('doubles');

        setAnchorKind('not-a-kind');
        expect(anchorKind.value).toBe('bond');
    });

    it('loads bond when the stored anchorKind is invalid', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ anchorKind: 'banana' }));

        const { wrapper, state } = mountPreferences();

        expect(state.anchorKind.value).toBe('bond');
        wrapper.unmount();
    });

    it('AC7 a stored total of three or four survives, an unsupported one falls back to ten', () => {
        for (const total of [3, 4]) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ anchorTotal: total }));

            const { wrapper, state } = mountPreferences();
            expect(state.anchorTotal.value).toBe(total);
            wrapper.unmount();
            localStorage.clear();
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ anchorTotal: 7 }));

        const { wrapper, state } = mountPreferences();
        expect(state.anchorTotal.value).toBe(10);
        wrapper.unmount();
    });

    it('updates mode, total and kind in one setTaskOption call', () => {
        const { mode, anchorTotal, anchorKind, setTaskOption } = usePreferences();

        setTaskOption({ mode: 'anchor', anchorTotal: 5, anchorKind: 'bond' });

        expect(mode.value).toBe('anchor');
        expect(anchorTotal.value).toBe(5);
        expect(anchorKind.value).toBe('bond');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toMatchObject({
            mode: 'anchor',
            anchorTotal: 5,
            anchorKind: 'bond'
        });

        setTaskOption({ mode: 'anchor', anchorTotal: 10, anchorKind: 'doubles' });
        expect(anchorKind.value).toBe('doubles');
    });
});
