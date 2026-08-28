/**
 * usePreferences.js — Vue composable for user preferences persisted to localStorage.
 * Stores: player name and mascot selection.
 */
import { ref, onMounted } from 'vue';

const STORAGE_KEY = 'mathGame.preferences';
const DEFAULT_MAX_LIMIT = 10;
const MIN_LIMIT = 5;
const MAX_LIMIT = 20;

// Default mascot for kids
const DEFAULT_MASCOT = '🦊';

// Available mascots
const MASCOTS = ['🦊', '🐱', '🐶', '🐰', '🦁', '🐼', '🚀', '🦄'];

// Available names for random fallback (when no name set)
const RANDOM_NAMES = ['Super Star', 'Math Whiz', 'Problem Solver', 'Number Ninja', 'Brainiac'];

export function usePreferences() {
    const playerName = ref('');
    const mascot = ref(DEFAULT_MASCOT);
    const maxLimit = ref(DEFAULT_MAX_LIMIT);

    // Load preferences from localStorage on mount
    onMounted(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                if (prefs.playerName) playerName.value = prefs.playerName;
                if (prefs.mascot && MASCOTS.includes(prefs.mascot)) mascot.value = prefs.mascot;
                if (prefs.maxLimit !== undefined) {
                    maxLimit.value = Math.min(Math.max(Number(prefs.maxLimit), MIN_LIMIT), MAX_LIMIT);
                }
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
        const clamped = Math.min(Math.max(Number(limit), MIN_LIMIT), MAX_LIMIT);
        maxLimit.value = clamped;
        savePreferences();
    };

    const getRandomName = () => {
        return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    };

    const savePreferences = () => {
        const prefs = {
            playerName: playerName.value,
            mascot: mascot.value,
            maxLimit: maxLimit.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    };

    return {
        playerName,
        mascot,
        maxLimit,
        setPlayerName,
        setMascot,
        setMaxLimit,
        getRandomName,
        MASCOTS
    };
}