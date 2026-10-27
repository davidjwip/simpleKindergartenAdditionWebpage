/**
 * useProgressStats.js — daily progress that survives a reload.
 *
 * A new day resets the today-only counters (best streak today, solved today,
 * per-mode solves) while the all-time best streak is kept. The counters are
 * stored under one version-free key so the adult's summary can show what
 * happened today without changing the child's visible streak.
 */
import { ref } from 'vue';

export const PROGRESS_STORAGE_KEY = 'mathGame.progress';
const MODE_IDS = ['result', 'part', 'start', 'anchor'];

export function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function emptyModeCounts() {
    return { result: 0, part: 0, start: 0, anchor: 0 };
}

function nonNegativeInt(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

function normalizeModeCounts(raw) {
    const counts = emptyModeCounts();
    if (!raw || typeof raw !== 'object') return counts;
    MODE_IDS.forEach((id) => {
        counts[id] = nonNegativeInt(raw[id]);
    });
    return counts;
}

function readStoredProgress() {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        return null;
    }
}

export function useProgressStats() {
    const bestEver = ref(0);
    const bestToday = ref(0);
    const solvedToday = ref(0);
    const modeCounts = ref(emptyModeCounts());
    let dayKey = todayKey();

    const persist = () => {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
            date: dayKey,
            bestEver: bestEver.value,
            bestToday: bestToday.value,
            solvedToday: solvedToday.value,
            modeCounts: modeCounts.value
        }));
    };

    const resetDay = (nextKey) => {
        dayKey = nextKey;
        bestToday.value = 0;
        solvedToday.value = 0;
        modeCounts.value = emptyModeCounts();
    };

    const ensureToday = () => {
        const nextKey = todayKey();
        if (nextKey === dayKey) return;
        resetDay(nextKey);
        persist();
    };

    const stored = readStoredProgress();
    if (stored) {
        bestEver.value = nonNegativeInt(stored.bestEver);
        if (stored.date === dayKey) {
            bestToday.value = nonNegativeInt(stored.bestToday);
            solvedToday.value = nonNegativeInt(stored.solvedToday);
            modeCounts.value = normalizeModeCounts(stored.modeCounts);
        }
    }

    const recordSolved = (streakValue, modeValue) => {
        ensureToday();
        solvedToday.value++;
        const id = MODE_IDS.includes(modeValue) ? modeValue : 'result';
        modeCounts.value = {
            ...modeCounts.value,
            [id]: modeCounts.value[id] + 1
        };
        const streakNumeric = nonNegativeInt(streakValue);
        if (streakNumeric > bestToday.value) bestToday.value = streakNumeric;
        if (streakNumeric > bestEver.value) bestEver.value = streakNumeric;
        persist();
    };

    return {
        bestEver,
        bestToday,
        solvedToday,
        modeCounts,
        recordSolved,
        ensureToday
    };
}
