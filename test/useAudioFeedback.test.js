// useAudioFeedback.test.js — tests for the audio feedback composable
// Tests verify muted state, mute toggle, and that audio functions don't throw.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAudioFeedback } from '../src/useAudioFeedback';

const AUDIO_MUTE_KEY = 'mathGame.muted';

describe('useAudioFeedback', () => {
    beforeEach(() => {
        localStorage.clear();
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
});