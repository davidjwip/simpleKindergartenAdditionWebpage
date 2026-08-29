import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAudioFeedback, _resetAudioContext } from '../src/useAudioFeedback';

const AUDIO_MUTE_KEY = 'mathGame.muted';

describe('useAudioFeedback', () => {
    beforeEach(() => {
        localStorage.clear();
        _resetAudioContext();
        vi.restoreAllMocks();
    });

    it('defaults to not muted', () => {
        const { isMuted } = useAudioFeedback();
        expect(isMuted.value).toBe(false);
    });

    it('toggleMuted toggles mute state and persists to localStorage', () => {
        const { isMuted, toggleMuted } = useAudioFeedback();
        
        // Initially not muted
        expect(isMuted.value).toBe(false);
        expect(localStorage.getItem(AUDIO_MUTE_KEY)).toBe(null);
        
        // Toggle to muted
        toggleMuted();
        expect(isMuted.value).toBe(true);
        expect(localStorage.getItem(AUDIO_MUTE_KEY)).toBe('true');
        
        // Toggle back to not muted
        toggleMuted();
        expect(isMuted.value).toBe(false);
        expect(localStorage.getItem(AUDIO_MUTE_KEY)).toBe('false');
    });

    it('playCorrect does not throw when not muted', () => {
        const { playCorrect, isMuted } = useAudioFeedback();
        expect(isMuted.value).toBe(false);
        expect(() => playCorrect()).not.toThrow();
    });

    it('playCorrect does not play when muted', () => {
        const { playCorrect, isMuted, toggleMuted } = useAudioFeedback();
        toggleMuted();
        expect(isMuted.value).toBe(true);
        expect(() => playCorrect()).not.toThrow();
    });

    it('playIncorrect does not throw when not muted', () => {
        const { playIncorrect, isMuted } = useAudioFeedback();
        expect(isMuted.value).toBe(false);
        expect(() => playIncorrect()).not.toThrow();
    });

    it('playIncorrect does not play when muted', () => {
        const { playIncorrect, isMuted, toggleMuted } = useAudioFeedback();
        toggleMuted();
        expect(isMuted.value).toBe(true);
        expect(() => playIncorrect()).not.toThrow();
    });

    it('playCelebration does not throw when not muted', () => {
        const { playCelebration, isMuted } = useAudioFeedback();
        expect(isMuted.value).toBe(false);
        expect(() => playCelebration()).not.toThrow();
    });

    it('playCelebration does not play when muted', () => {
        const { playCelebration, isMuted, toggleMuted } = useAudioFeedback();
        toggleMuted();
        expect(isMuted.value).toBe(true);
        expect(() => playCelebration()).not.toThrow();
    });

    it('reuses a single AudioContext across multiple sound plays', () => {
        const mockCtx = {
            state: 'running',
            currentTime: 0,
            destination: {},
            createOscillator: () => ({
                connect: vi.fn(),
                frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
                start: vi.fn(),
                stop: vi.fn(),
                type: 'sine',
            }),
            createGain: () => ({
                connect: vi.fn(),
                gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
            }),
            resume: vi.fn(),
        };

        const AudioContextSpy = vi.fn(() => mockCtx);
        vi.stubGlobal('AudioContext', AudioContextSpy);

        const { playCorrect, playIncorrect, playCelebration } = useAudioFeedback();

        playCorrect();
        playCorrect();
        playIncorrect();
        playCelebration();
        playCelebration();

        expect(AudioContextSpy).toHaveBeenCalledTimes(1);

        vi.unstubAllGlobals();
    });
});