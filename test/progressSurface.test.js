// progressSurface.test.js — I6 forgiving progress surface.
// Covers the non-punitive visible streak (best today), the always-mounted
// mascot, and the persisted daily counts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';
import { useMathGame } from '../src/useMathGame';
import { useProgressStats, PROGRESS_STORAGE_KEY as PROGRESS_KEY, todayKey } from '../src/useProgressStats';
const AUTO_ADVANCE = 2000;

function solveCorrectly(game) {
    game.num1.value = '2';
    game.num2.value = '3';
    game.answer.value = '5';
    game.checkAnswer();
}

function makeWrong(game) {
    game.num1.value = '2';
    game.num2.value = '3';
    game.answer.value = '9';
    game.checkAnswer();
}

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

function seedProgress(overrides = {}) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        date: '2000-01-01',
        bestEver: 9,
        bestToday: 6,
        solvedToday: 12,
        modeCounts: { result: 5, part: 4, start: 2, anchor: 1 },
        ...overrides
    }));
}

describe('I6 forgiving streak (composable)', () => {
    let game;

    beforeEach(() => {
        game = useMathGame();
        game.resetProgress();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps best-today at its high-water mark after a wrong answer', () => {
        for (let i = 0; i < 5; i++) {
            solveCorrectly(game);
            if (i < 4) game.generateNewProblem();
        }

        expect(game.streak.value).toBe(5);
        expect(game.bestStreakToday.value).toBe(5);
        expect(game.bestStreak.value).toBe(5);

        game.generateNewProblem();
        makeWrong(game);

        // The live counter may reset internally, but the visible best-today
        // counter must not collapse to zero.
        expect(game.streak.value).toBe(0);
        expect(game.bestStreakToday.value).toBe(5);
        expect(game.bestStreak.value).toBe(5);
    });

    it('persists best-today and the daily solved count across a reload', () => {
        solveCorrectly(game);
        game.generateNewProblem();
        solveCorrectly(game);

        expect(game.bestStreakToday.value).toBe(2);
        expect(game.dailySolved.value).toBe(2);

        const reloaded = useMathGame();

        expect(reloaded.bestStreakToday.value).toBe(2);
        expect(reloaded.dailySolved.value).toBe(2);
        expect(reloaded.bestStreak.value).toBe(2);
        expect(reloaded.dailyModeCounts.value.result).toBe(2);
    });

    it('counts solved problems per mode for the day', () => {
        solveCorrectly(game);
        game.setMode('part');
        solveCorrectly(game);
        game.setMode('anchor');
        solveCorrectly(game);

        expect(game.dailySolved.value).toBe(3);
        expect(game.dailyModeCounts.value).toEqual({
            result: 1,
            part: 1,
            start: 0,
            anchor: 1
        });
    });

    it('resets today counts on a new day but keeps the best ever', () => {
        seedProgress();

        const opened = useMathGame();

        expect(opened.bestStreak.value).toBe(9);
        expect(opened.bestStreakToday.value).toBe(0);
        expect(opened.dailySolved.value).toBe(0);
        expect(opened.dailyModeCounts.value).toEqual({
            result: 0,
            part: 0,
            start: 0,
            anchor: 0
        });
    });

    it('keeps today counts when the stored day is today', () => {
        seedProgress({ date: todayKey(), bestEver: 9, bestToday: 5, solvedToday: 7 });

        const opened = useMathGame();

        expect(opened.bestStreak.value).toBe(9);
        expect(opened.bestStreakToday.value).toBe(5);
        expect(opened.dailySolved.value).toBe(7);
    });

    it('resets today counts when the day changes while the app is open', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));

        const opened = useMathGame();
        solveCorrectly(opened);
        expect(opened.dailySolved.value).toBe(1);

        vi.setSystemTime(new Date(2026, 0, 2, 10, 0, 0));
        opened.generateNewProblem();
        solveCorrectly(opened);

        expect(opened.dailySolved.value).toBe(1);
        expect(opened.dailyModeCounts.value.result).toBe(1);
        expect(opened.bestStreak.value).toBe(2);
    });

    it('ignores corrupt stored progress', () => {
        localStorage.setItem(PROGRESS_KEY, '{not valid json');

        const opened = useMathGame();

        expect(opened.bestStreak.value).toBe(0);
        expect(opened.bestStreakToday.value).toBe(0);
        expect(opened.dailySolved.value).toBe(0);
    });

    it('falls back to zeroes for malformed mode counts', () => {
        seedProgress({ date: todayKey(), modeCounts: null });

        const opened = useMathGame();

        expect(opened.dailyModeCounts.value).toEqual({
            result: 0,
            part: 0,
            start: 0,
            anchor: 0
        });
    });

    it('files an unknown mode under the default total count', () => {
        const stats = useProgressStats();

        stats.recordSolved(1, 'banana');

        expect(stats.modeCounts.value.result).toBe(1);
        expect(stats.solvedToday.value).toBe(1);
    });
});

describe('I6 progress surface (component)', () => {
    beforeEach(() => {
        // The shared setup clears storage; keep these tests explicit.
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps the mascot mounted and shows best-today after a wrong answer from a streak of five', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = mount(App);

            for (let i = 0; i < 5; i++) {
                const { correct } = currentSolution(wrapper);
                await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
                await wrapper.vm.$nextTick();
                if (i < 4) {
                    vi.advanceTimersByTime(AUTO_ADVANCE);
                    await wrapper.vm.$nextTick();
                }
            }

            expect(wrapper.vm.streak).toBe(5);
            expect(wrapper.vm.bestStreakToday).toBe(5);

            vi.advanceTimersByTime(AUTO_ADVANCE);
            await wrapper.vm.$nextTick();

            const { correct } = currentSolution(wrapper);
            const wrong = correct === 1 ? 2 : 1;
            await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.streak).toBe(0);
            expect(wrapper.find('.mascot').exists()).toBe(true);
            expect(wrapper.find('.mascot').text()).toBe(wrapper.vm.mascot);

            const visibleStreak = wrapper.find('.streak-count').text();
            expect(visibleStreak).toContain('5');
            expect(visibleStreak).not.toMatch(/\b0\b/);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('shows reset daily counts on a new day while keeping the best ever', async () => {
        seedProgress();

        const wrapper = mount(App);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.daily-solved').text()).toContain('0');
        expect(wrapper.find('.best-ever').text()).toContain('9');
        expect(wrapper.find('.mode-count-result').text()).toContain('0');

        wrapper.unmount();
    });
});
