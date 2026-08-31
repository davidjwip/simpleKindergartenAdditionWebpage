import { ref, onMounted } from 'vue';

const AUDIO_MUTE_KEY = 'mathGame.muted';

let sharedCtx = null;

function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedCtx || sharedCtx.state === 'closed') {
        sharedCtx = new AudioContextClass();
    }

    if (sharedCtx.state === 'suspended') {
        sharedCtx.resume();
    }

    return sharedCtx;
}

function playCorrectChime() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

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

function playIncorrectTone() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

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

function playCelebrationFanfare() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, now); // C5
        osc.frequency.setValueAtTime(1318.51, now + 0.15); // E5
        osc.frequency.setValueAtTime(1567.98, now + 0.30); // G5
        osc.frequency.setValueAtTime(2093.00, now + 0.45); // C6

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

export function _resetAudioContext() {
    sharedCtx = null;
}