/**
 * useAudioFeedback.js — Vue composable for sound effects.
 * Uses Web Audio API for beeps. All APIs are guarded to avoid errors
 * in non-browser/test environments.
 */
import { ref, onMounted } from 'vue';

const AUDIO_MUTE_KEY = 'mathGame.muted';

/**
 * Play a short pleasant chime using Web Audio API.
 * Returns silently if AudioContext is unavailable.
 */
function playCorrectChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Play a cheerful major chord arpeggio: C4 -> E4 -> G4
        const now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C4
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E4
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G4

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
    } catch (e) {
        // Silent fail for test environments or blocked audio
    }
}

/**
 * Play a soft descending tone for incorrect answers.
 */
function playIncorrectTone() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.3);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {
        // Silent fail
    }
}

/**
 * Play a celebratory fanfare for the 10-problem reward screen.
 * Returns silently if AudioContext is unavailable.
 */
function playCelebrationFanfare() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Rising C-major arpeggio: C5 -> E5 -> G5 -> C6, then sustain chord
        const now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, now); // C5
        osc.frequency.setValueAtTime(1318.51, now + 0.15); // E5
        osc.frequency.setValueAtTime(1567.98, now + 0.30); // G5
        osc.frequency.setValueAtTime(2093.00, now + 0.45); // C6

        // Sustain the chord for 1 second
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

        osc.start(now);
        osc.stop(now + 1.0);
    } catch (e) {
        // Silent fail for test environments or blocked audio
    }
}

export function useAudioFeedback() {
    const isMuted = ref(false);

    // Load mute state from localStorage on mount
    onMounted(() => {
        const saved = localStorage.getItem(AUDIO_MUTE_KEY);
        if (saved !== null) {
            isMuted.value = saved === 'true';
        }
    });

    const toggleMuted = () => {
        isMuted.value = !isMuted.value;
        localStorage.setItem(AUDIO_MUTE_KEY, String(isMuted.value));
    };

    const playCorrect = () => {
        if (isMuted.value) return;
        playCorrectChime();
    };

    const playIncorrect = () => {
        if (isMuted.value) return;
        playIncorrectTone();
    };

    const playCelebration = () => {
        if (isMuted.value) return;
        playCelebrationFanfare();
    };

    return {
        isMuted,
        toggleMuted,
        playCorrect,
        playIncorrect,
        playCelebration
    };
}