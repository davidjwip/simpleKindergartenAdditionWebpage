// anchorFamilies.test.js — I3c2: make-five, doubles and the settled round contract.
// An anchor round counts finished presentations, not correct answers.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { watch, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';
import { useMathGame } from '../src/useMathGame';
import {
    buildPass,
    generateDoubles,
    makeRng,
    numericTotal,
    roundLengthForTotal,
    trackLengthForTotal
} from '../src/anchorEngine';

const STORAGE_KEY = 'mathGame.preferences';
const AUTO_ADVANCE = 2000;
const HOLD_DELAY = 1500;
const REVEAL_DELAY = 2500;
const CLOSE_DELAY = 500;

async function mountApp(prefs = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    const wrapper = mount(App);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    return wrapper;
}

async function mountFamily(family) {
    return mountApp({
        mode: 'anchor',
        anchorTotal: family === 'make-five' ? 5 : 10,
        anchorKind: family === 'doubles' ? 'doubles' : 'bond'
    });
}

async function openSettings(wrapper) {
    if (!wrapper.find('.settings-panel').exists()) {
        const headerBtns = wrapper.findAll('.header-actions .action-btn');
        await headerBtns[headerBtns.length - 1].trigger('click');
    }
    return wrapper.find('.settings-panel');
}

function correctValue(wrapper) {
    const inputs = wrapper.findAll('.problem input');
    const blank = inputs.findIndex((input) => input.element.value === '');
    const [a, b, c] = inputs.map((input) => (
        input.element.value === '' ? null : Number(input.element.value)
    ));
    const fromDom = blank === 0 ? c - b : blank === 1 ? c - a : a + b;

    const blankField = wrapper.vm.blankField;
    const shown1 = Number(wrapper.vm.num1);
    const shown2 = Number(wrapper.vm.num2);
    const shownAnswer = Number(wrapper.vm.answer);
    const fromState = blankField === 'num1' ? shownAnswer - shown2
        : blankField === 'num2' ? shownAnswer - shown1
            : shown1 + shown2;

    expect(fromDom).toBe(fromState);
    return fromState;
}

function gameFields(game) {
    return [game.num1.value, game.num2.value, game.answer.value];
}

function gameCorrectValue(game) {
    const blank = game.blankField.value;
    const a = Number(game.num1.value);
    const b = Number(game.num2.value);
    const c = Number(game.answer.value);
    if (blank === 'num1') return c - b;
    if (blank === 'num2') return c - a;
    return a + b;
}

function gameItem(game) {
    const blank = game.blankField.value;
    const a = Number(game.num1.value);
    const b = Number(game.num2.value);
    const c = Number(game.answer.value);
    return {
        num1: blank === 'num1' ? c - b : a,
        num2: blank === 'num2' ? c - a : b,
        answer: blank === 'answer' ? a + b : c
    };
}

async function finishCorrect(wrapper) {
    const correct = correctValue(wrapper);
    await wrapper.findAll('.touchpad-btn')[correct - 1].trigger('click');
    await wrapper.vm.$nextTick();
}

async function finishMissed(wrapper) {
    const correct = correctValue(wrapper);
    const wrong = correct === 1 ? 2 : 1;

    await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
    await wrapper.vm.$nextTick();
    vi.advanceTimersByTime(HOLD_DELAY);
    await wrapper.vm.$nextTick();
    await wrapper.findAll('.touchpad-btn')[wrong - 1].trigger('click');
    await wrapper.vm.$nextTick();
}

async function advanceAfter(wrapper, missed) {
    vi.advanceTimersByTime(missed ? REVEAL_DELAY : AUTO_ADVANCE);
    await wrapper.vm.$nextTick();
}

async function finishRound(wrapper, roundLength, missedIndexes = []) {
    for (let i = 0; i < roundLength; i++) {
        const missed = missedIndexes.includes(i);
        if (missed) {
            await finishMissed(wrapper);
        } else {
            await finishCorrect(wrapper);
        }
        if (i < roundLength - 1) {
            expect(wrapper.vm.celebrationVisible).toBe(false);
            await advanceAfter(wrapper, missed);
        }
    }
}

describe('anchor family lengths', () => {
    it('resolves every named family to a concrete round and track length', () => {
        expect(numericTotal('make-five')).toBe(5);
        expect(numericTotal('make-ten')).toBe(10);
        expect(numericTotal('doubles')).toBe(10);
        expect(numericTotal({ total: 5 })).toBe(5);
        expect(numericTotal(10)).toBe(10);

        expect(roundLengthForTotal('make-five')).toBe(8);
        expect(roundLengthForTotal('make-ten')).toBe(9);
        expect(roundLengthForTotal('doubles')).toBe(5);

        expect(trackLengthForTotal('make-five')).toBe(8);
        expect(trackLengthForTotal('make-ten')).toBe(9);
        expect(trackLengthForTotal('doubles')).toBe(5);
    });

    it('rejects a name that is not a known family', () => {
        expect(() => numericTotal('make-seven')).toThrow(RangeError);
        expect(() => roundLengthForTotal('make-seven')).toThrow(RangeError);
        expect(() => trackLengthForTotal('make-seven')).toThrow(RangeError);
    });

    it('builds a four-item make-five pass with the 2/2 blank split', () => {
        const pass = buildPass('make-five', makeRng(3));

        expect(pass).toHaveLength(4);
        expect(pass.map((item) => `${item.num1}+${item.num2}`).sort()).toEqual([
            '1+4', '2+3', '3+2', '4+1'
        ]);
        expect(pass.filter((item) => item.blankField === 'num1')).toHaveLength(2);
        expect(pass.filter((item) => item.blankField === 'num2')).toHaveLength(2);
        for (const item of pass) {
            expect(item.answer).toBe(5);
            expect(item.kind).toBe('bond');
        }
    });

    it('builds a five-item doubles pass that blanks the total', () => {
        const pass = buildPass('doubles', makeRng(3));

        expect(pass).toHaveLength(5);
        expect(pass.map((item) => item.num1).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
        for (const item of pass) {
            expect(item.kind).toBe('doubles');
            expect(item.blankField).toBe('answer');
            expect(item.num1).toBe(item.num2);
            expect(item.answer).toBe(item.num1 * 2);
        }

        expect(buildPass({ total: 10, kind: 'doubles' }, makeRng(4))).toHaveLength(5);
    });

    it('rejects doubles outside the reachable 1..5 range', () => {
        expect(() => generateDoubles(0)).toThrow(RangeError);
        expect(() => generateDoubles(6)).toThrow(RangeError);
    });
});

describe('anchor family selection in the game', () => {
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

    it('switches to doubles with a five-item round', () => {
        game.setMode('anchor');
        game.setAnchorKind('doubles');

        expect(game.anchorKind.value).toBe('doubles');
        expect(game.roundLength.value).toBe(5);
        expect(game.keypadLength.value).toBe(10);
        expect(game.frameKind.value).toBe('doubles');
    });

    it('switches a doubles selection back to the five family', () => {
        game.setMode('anchor');
        game.setAnchorKind('doubles');

        game.setAnchorTotal(5);

        expect(game.anchorKind.value).toBe('bond');
        expect(game.anchorTotal.value).toBe(5);
        expect(game.roundLength.value).toBe(8);
        expect(game.keypadLength.value).toBe(5);
        expect(game.frameKind.value).toBe('bond');
    });

    it('AC5 keypad length is the total for bonds and ten for doubles', () => {
        game.setMode('anchor');

        for (const total of [3, 4, 5, 10]) {
            game.setModeOption({ mode: 'anchor', anchorTotal: total, anchorKind: 'bond' });

            expect(game.anchorTotal.value).toBe(total);
            expect(game.keypadLength.value).toBe(total);
        }

        game.setModeOption({ mode: 'anchor', anchorTotal: 4, anchorKind: 'doubles' });

        expect(game.keypadLength.value).toBe(10);
    });

    it('stores a family while another mode is active without regenerating it', () => {
        game.setMode('result');
        const before = [game.num1.value, game.num2.value, game.answer.value];

        game.setAnchorKind('doubles');
        game.setAnchorTotal(5);

        expect(game.anchorKind.value).toBe('bond');
        expect(game.anchorTotal.value).toBe(5);
        expect([game.num1.value, game.num2.value, game.answer.value]).toEqual(before);
    });
});

describe('pass and progress guards', () => {
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

    it('leaves the ordinary track and celebration alone when a result item is missed', () => {
        const correct = gameCorrectValue(game);
        const wrong = correct === 1 ? 2 : 1;

        game.fillValue(wrong);
        vi.advanceTimersByTime(HOLD_DELAY);

        const notifications = [];
        game.setProgressCallback(() => {
            notifications.push({
                round: game.roundProgress.value,
                solved: game.problemsSolved.value
            });
        });

        const roundBefore = game.roundProgress.value;
        const solvedBefore = game.problemsSolved.value;

        game.fillValue(wrong);

        expect(game.isRevealing.value).toBe(true);
        expect(game.roundProgress.value).toBe(roundBefore);
        expect(game.problemsSolved.value).toBe(solvedBefore);
        expect(notifications.filter((entry) => entry.round >= game.roundLength.value)).toHaveLength(0);
        expect(notifications).toHaveLength(1);
    });

    it('keeps the current item on a no-op setModeOption', () => {
        game.setModeOption({ mode: 'anchor', anchorTotal: 10, anchorKind: 'bond' });
        const before = gameFields(game);
        const progress = game.roundProgress.value;

        game.setModeOption({ mode: 'anchor', anchorTotal: 10, anchorKind: 'bond' });

        expect(gameFields(game)).toEqual(before);
        expect(game.roundProgress.value).toBe(progress);
    });

    it('keeps progress and the current item when the active family is re-selected', () => {
        game.setModeOption({ mode: 'anchor', anchorTotal: 10, anchorKind: 'bond' });
        for (let i = 0; i < 3; i++) {
            game.fillValue(gameCorrectValue(game));
            vi.advanceTimersByTime(AUTO_ADVANCE);
        }
        const before = gameFields(game);
        const progress = game.roundProgress.value;
        expect(progress).toBe(3);

        game.setAnchorTotal(10);
        expect(game.anchorTotal.value).toBe(10);
        expect(game.roundProgress.value).toBe(progress);
        expect(gameFields(game)).toEqual(before);

        game.setAnchorKind('bond');
        expect(game.anchorKind.value).toBe('bond');
        expect(game.roundProgress.value).toBe(progress);
        expect(gameFields(game)).toEqual(before);
    });

    it('does not advance a completed round when its final item is missed', () => {
        game.setModeOption({ mode: 'anchor', anchorTotal: 10, anchorKind: 'bond' });
        let celebrationVisible = false;
        game.setProgressCallback(() => {
            if (game.roundProgress.value >= game.roundLength.value) {
                celebrationVisible = true;
            }
        });

        for (let i = 0; i < game.roundLength.value; i++) {
            const correct = gameCorrectValue(game);
            const wrong = correct === 1 ? 2 : 1;
            game.fillValue(wrong);
            vi.advanceTimersByTime(HOLD_DELAY);
            game.fillValue(wrong);
            if (i < game.roundLength.value - 1) {
                vi.advanceTimersByTime(REVEAL_DELAY);
            }
        }

        expect(game.roundProgress.value).toBe(game.roundLength.value);
        expect(celebrationVisible).toBe(true);
        expect(vi.getTimerCount()).toBe(0);

        const shown = gameFields(game);
        vi.advanceTimersByTime(REVEAL_DELAY);
        expect(gameFields(game)).toEqual(shown);
    });

    it('AC4 a make-three round never repeats an item back-to-back', () => {
        // Both pass orders are possible, so some seeds put the first pass's tail at the head of the
        // second pass unless the boundary swap runs. Checking a spread of seeds makes deleting that
        // swap fail rather than passing by a lucky fixture.
        for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
            const makeThree = useMathGame({ anchorRng: makeRng(seed) });
            makeThree.setOperator('+');
            makeThree.setModeOption({ mode: 'anchor', anchorTotal: 3, anchorKind: 'bond' });

            expect(makeThree.roundLength.value).toBe(4);

            const seen = [];
            for (let i = 0; i < 4; i++) {
                seen.push(`${gameItem(makeThree).num1}+${gameItem(makeThree).num2}`);
                makeThree.fillValue(gameCorrectValue(makeThree));
                vi.advanceTimersByTime(AUTO_ADVANCE);
            }

            for (let i = 1; i < seen.length; i++) {
                expect(seen[i]).not.toBe(seen[i - 1]);
            }
        }
    });

    it('serves two pass-permutations from one continuous stream without replaying across the boundary', () => {
        // Seeded, so this test is reproducible rather than dependent on the wall clock.
        const game = useMathGame({ anchorRng: makeRng(4242) });
        game.setModeOption({ mode: 'anchor', anchorTotal: 5, anchorKind: 'bond' });

        const seen = [];
        for (let i = 0; i < 8; i++) {
            seen.push(gameItem(game));
            game.fillValue(gameCorrectValue(game));
            vi.advanceTimersByTime(AUTO_ADVANCE);
        }

        const order = (items) => items.map((item) => `${item.num1}+${item.num2}`);
        const expectedPairs = ['1+4', '2+3', '3+2', '4+1'];
        const firstBlock = order(seen.slice(0, 4));
        const secondBlock = order(seen.slice(4));

        // The contract is a permutation per pass plus a non-repeating boundary. Pinning the exact
        // order (or asserting the two passes differ) made this test depend on the shuffle: the
        // engine seeds one rng per module instance from the wall clock, so order varies between
        // runs and two permutations match 1 time in 24. That flake is what failed CI on the
        // release PR.
        expect([...firstBlock].sort()).toEqual([...expectedPairs].sort());
        expect([...secondBlock].sort()).toEqual([...expectedPairs].sort());
        expect(new Set(firstBlock).size).toBe(4);
        expect(new Set(secondBlock).size).toBe(4);
        expect(firstBlock[3]).not.toBe(secondBlock[0]);
    });
});

describe('settled round contract', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('AC8 the frame draws one row of three cells at total three', async () => {
        const wrapper = await mountApp({
            mode: 'anchor',
            anchorTotal: 3,
            anchorKind: 'bond'
        });

        expect(wrapper.vm.anchorTotal).toBe(3);
        expect(wrapper.find('.number-frame').attributes('data-total')).toBe('3');
        expect(wrapper.findAll('.frame-row')).toHaveLength(1);
        expect(wrapper.findAll('.frame-cell')).toHaveLength(3);

        wrapper.unmount();
    });

    it('celebrates exactly once at the eighth make-five item despite two misses', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountFamily('make-five');
            expect(wrapper.vm.roundLength).toBe(8);

            let fires = 0;
            const stop = watch(
                () => wrapper.vm.celebrationVisible,
                (visible) => {
                    if (visible) fires++;
                }
            );

            await finishRound(wrapper, 8, [0, 1]);
            await nextTick();

            expect(wrapper.vm.roundProgress).toBe(8);
            expect(wrapper.vm.celebrationVisible).toBe(true);
            expect(fires).toBe(1);

            // Close the overlay, then answer one more item: the overlay must NOT re-open, and the
            // watcher must not observe a second false→true transition. (Asserting "still visible"
            // while it was never closed proves nothing.)
            await wrapper.find('.celebration-close-btn').trigger('click');
            await vi.advanceTimersByTime(600);
            await nextTick();
            expect(wrapper.vm.celebrationVisible).toBe(false);
            const firesAfterClose = fires;

            await finishCorrect(wrapper);
            await nextTick();

            expect(wrapper.vm.celebrationVisible).toBe(false);
            expect(fires).toBe(firesAfterClose);
            // and the answer really did land in a *new* round, otherwise "no re-fire" proves nothing
            expect(wrapper.vm.roundProgress).toBe(1);


            stop();
            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('celebrates at the ninth make-ten item when one item is missed', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountFamily('make-ten');
            expect(wrapper.vm.roundLength).toBe(9);

            await finishRound(wrapper, 9, [0]);

            expect(wrapper.vm.roundProgress).toBe(9);
            // contract item 7: the revealed item advanced the round but never the score
            expect(wrapper.vm.problemsSolved).toBe(8);
            expect(wrapper.vm.totalProblems).toBe(9);
            expect(wrapper.vm.celebrationVisible).toBe(true);
            expect(wrapper.find('.celebration-overlay').classes('visible')).toBe(true);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('celebrates at the fifth doubles item when one item is missed', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountFamily('doubles');
            expect(wrapper.vm.roundLength).toBe(5);

            await finishRound(wrapper, 5, [0]);

            expect(wrapper.vm.roundProgress).toBe(5);
            expect(wrapper.findAll('.step')).toHaveLength(5);
            expect(wrapper.vm.celebrationVisible).toBe(true);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('fills the track to the round length and resets it when the celebration closes', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountFamily('make-five');
            expect(wrapper.findAll('.step')).toHaveLength(8);

            await finishRound(wrapper, 8);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.roundProgress).toBe(8);
            expect(wrapper.findAll('.step.filled')).toHaveLength(8);

            await wrapper.find('.celebration-close-btn').trigger('click');
            vi.advanceTimersByTime(CLOSE_DELAY);
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.celebrationVisible).toBe(false);
            expect(wrapper.vm.roundProgress).toBe(0);
            expect(wrapper.findAll('.step.filled')).toHaveLength(0);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('shows no celebration with seven of eight make-five items presented', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountFamily('make-five');

            for (let i = 0; i < 7; i++) {
                await finishCorrect(wrapper);
                await advanceAfter(wrapper, false);
            }

            expect(wrapper.vm.roundProgress).toBe(7);
            expect(wrapper.vm.celebrationVisible).toBe(false);
            expect(wrapper.find('.celebration-overlay').classes('visible')).toBe(false);

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('fills every doubles frame cell from the current item', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = await mountFamily('doubles');

            for (let i = 0; i < 5; i++) {
                const shown = Number(wrapper.vm.num1);
                expect(Number(wrapper.vm.num2)).toBe(shown);
                expect(wrapper.vm.frameTotal).toBe(shown * 2);
                expect(wrapper.findAll('.frame-cell')).toHaveLength(shown * 2);
                expect(wrapper.findAll('.frame-cell.filled')).toHaveLength(shown * 2);
                expect(wrapper.findAll('.frame-cell.empty')).toHaveLength(0);

                await finishCorrect(wrapper);
                if (i < 4) await advanceAfter(wrapper, false);
            }

            wrapper.unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('disables the anchor families under minus and shows the adding advice line', async () => {
        const wrapper = await mountApp();

        await wrapper.find('.operator-toggle button:last-child').trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.operator').text()).toBe('−');

        const settings = await openSettings(wrapper);
        const labels = ['Make 10', 'Make 5', 'Doubles'];

        for (const label of labels) {
            const button = wrapper.findAll('.mode-btn').find((entry) => entry.text() === label);
            expect(button).toBeTruthy();
            expect(button.element.disabled).toBe(true);
        }

        const resultButton = wrapper.findAll('.mode-btn').find(
            (entry) => entry.text() === 'Find the total'
        );
        expect(resultButton.element.disabled).toBe(false);
        expect(settings.find('.anchor-advisory').text()).toContain(
            'making 5 and 10 is adding'
        );

        wrapper.unmount();
    });
});

describe('seeded rng: the shuffle is reproducible when the test supplies it', () => {
    // The flake that failed the release PR came from the composable seeding its rng from the clock.
    // With an injected rng the order is a fixture, so an exact-order assertion is legitimate.
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('serves exactly the pass the engine builds from the same seed', () => {
        vi.useFakeTimers();
        const seed = 7;
        const seeded = useMathGame({ anchorRng: makeRng(seed) });
        seeded.setModeOption({ mode: 'anchor', anchorTotal: 5, anchorKind: 'bond' });

        const expectedFirst = buildPass('make-five', makeRng(seed)).map((i) => `${i.num1}+${i.num2}`);
        const seen = [];
        for (let i = 0; i < 4; i++) {
            const item = gameItem(seeded);
            seen.push(`${item.num1}+${item.num2}`);
            seeded.fillValue(gameCorrectValue(seeded));
            vi.advanceTimersByTime(AUTO_ADVANCE);
        }
        expect(seen).toEqual(expectedFirst);
    });

    it('honours each seed independently, compared against the engine rather than against another seed', () => {
        vi.useFakeTimers();
        const order = (seed) => {
            const g = useMathGame({ anchorRng: makeRng(seed) });
            g.setModeOption({ mode: 'anchor', anchorTotal: 5, anchorKind: 'bond' });
            const out = [];
            for (let i = 0; i < 4; i++) {
                const item = gameItem(g);
                out.push(`${item.num1}+${item.num2}`);
                g.fillValue(gameCorrectValue(g));
                vi.advanceTimersByTime(AUTO_ADVANCE);
            }
            return out;
        };
        // Each seed is checked against the order its own rng produces. Comparing seed 11 to seed 29
        // would coincidentally pass or fail 1 time in 24 — the exact defect this increment forbids.
        for (const seed of [11, 29]) {
            const fromEngine = buildPass('make-five', makeRng(seed)).map((i) => `${i.num1}+${i.num2}`);
            expect(order(seed)).toEqual(fromEngine);
        }
    });
});
