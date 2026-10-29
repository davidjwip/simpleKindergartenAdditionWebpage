/**
 * usePreferences.js — Vue composable for user preferences persisted to localStorage.
 * Stores: player name, mascot, number limit, task mode, step size and counters.
 */
import { ref, onMounted } from 'vue';
import { STEPS } from './mathEngine';

const STORAGE_KEY = 'mathGame.preferences';
const DEFAULT_MAX_LIMIT = 10;
const MIN_LIMIT = 5;
const MAX_LIMIT = 20;
const MODES = ['result', 'part', 'start', 'anchor'];
const DEFAULT_MODE = 'result';
const DEFAULT_STEP = 'any';
const ANCHOR_TOTALS = [3, 4, 5, 10];
const DEFAULT_ANCHOR_TOTAL = 10;
const ANCHOR_KINDS = ['bond', 'doubles'];
const DEFAULT_ANCHOR_KIND = 'bond';
const DEFAULT_COUNTERS_ON = false;

// Default mascot for kids
const DEFAULT_MASCOT = '🦊';

// Available mascots
const MASCOTS = ['🦊', '🐱', '🐶', '🐰', '🦁', '🐼', '🚀', '🦄'];

// Available names for random fallback (when no name set)
const RANDOM_NAMES = ['Super Star', 'Math Whiz', 'Problem Solver', 'Number Ninja', 'Brainiac'];

function clampLimit(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_MAX_LIMIT;
    return Math.min(Math.max(numeric, MIN_LIMIT), MAX_LIMIT);
}

function normalizeAnchorTotal(value) {
    const numeric = Number(value);
    return ANCHOR_TOTALS.includes(numeric) ? numeric : DEFAULT_ANCHOR_TOTAL;
}

function normalizeAnchorKind(value) {
    return ANCHOR_KINDS.includes(value) ? value : DEFAULT_ANCHOR_KIND;
}

export function usePreferences() {
    const playerName = ref('');
    const mascot = ref(DEFAULT_MASCOT);
    const maxLimit = ref(DEFAULT_MAX_LIMIT);
    const mode = ref(DEFAULT_MODE);
    const step = ref(DEFAULT_STEP);
    const anchorTotal = ref(DEFAULT_ANCHOR_TOTAL);
    const anchorKind = ref(DEFAULT_ANCHOR_KIND);
    const countersOn = ref(DEFAULT_COUNTERS_ON);

    // Load preferences from localStorage on mount
    onMounted(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                if (prefs.playerName) playerName.value = prefs.playerName;
                if (prefs.mascot && MASCOTS.includes(prefs.mascot)) mascot.value = prefs.mascot;
                if (prefs.maxLimit !== undefined) {
                    maxLimit.value = clampLimit(prefs.maxLimit);
                }
                mode.value = MODES.includes(prefs.mode) ? prefs.mode : DEFAULT_MODE;
                step.value = STEPS.includes(prefs.step) ? prefs.step : DEFAULT_STEP;
                anchorTotal.value = normalizeAnchorTotal(prefs.anchorTotal);
                anchorKind.value = normalizeAnchorKind(prefs.anchorKind);
                countersOn.value = prefs.countersOn === true;
            } catch (e) {
                // Invalid JSON, use defaults
            }
        }
    });

    const setPlayerName = (name) => {
        playerName.value = name;
        savePreferences();
    };

    const setMascot = (selectedMascot) => {
        if (MASCOTS.includes(selectedMascot)) {
            mascot.value = selectedMascot;
            savePreferences();
        }
    };

    const setMaxLimit = (limit) => {
        maxLimit.value = clampLimit(limit);
        savePreferences();
    };

    const setMode = (selectedMode) => {
        if (MODES.includes(selectedMode)) {
            mode.value = selectedMode;
            savePreferences();
        }
    };

    const setStep = (selectedStep) => {
        if (STEPS.includes(selectedStep)) {
            step.value = selectedStep;
            savePreferences();
        }
    };

    const setAnchorTotal = (total) => {
        anchorTotal.value = normalizeAnchorTotal(total);
        savePreferences();
    };

    const setAnchorKind = (kind) => {
        anchorKind.value = normalizeAnchorKind(kind);
        savePreferences();
    };

    const setTaskOption = ({
        mode: nextMode = mode.value,
        anchorTotal: nextAnchorTotal = anchorTotal.value,
        anchorKind: nextAnchorKind = anchorKind.value
    } = {}) => {
        if (MODES.includes(nextMode)) mode.value = nextMode;
        const kind = normalizeAnchorKind(nextAnchorKind);
        // doubles is a family of totals (one and one … five and five), so the stored pair must not be
        // incoherent: {total: 5, kind: 'doubles'} is normalised to total 10.
        anchorKind.value = kind;
        anchorTotal.value = kind === 'doubles' ? 10 : normalizeAnchorTotal(nextAnchorTotal);
        savePreferences();
    };

    const setCountersOn = (enabled) => {
        countersOn.value = enabled === true;
        savePreferences();
    };

    const getRandomName = () => {
        return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    };

    const savePreferences = () => {
        const prefs = {
            playerName: playerName.value,
            mascot: mascot.value,
            maxLimit: maxLimit.value,
            mode: mode.value,
            step: step.value,
            anchorTotal: anchorTotal.value,
            anchorKind: anchorKind.value,
            countersOn: countersOn.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    };

    return {
        playerName,
        mascot,
        maxLimit,
        mode,
        step,
        anchorTotal,
        anchorKind,
        countersOn,
        setPlayerName,
        setMascot,
        setMaxLimit,
        setMode,
        setStep,
        setAnchorTotal,
        setAnchorKind,
        setTaskOption,
        setCountersOn,
        getRandomName,
        MASCOTS
    };
}