/**
 * Web Audio API Email Arrival Notification Chime
 *
 * Pure client-side synthesized 2-tone pleasant harmonic chime.
 * Zero external MP3 / audio asset dependencies.
 * State persisted in localStorage under 'mephisto_sound_enabled'.
 */

const SOUND_STORAGE_KEY = 'mephisto_sound_enabled';

/**
 * Check whether notification sounds are currently enabled.
 * Defaults to true if no preference is stored.
 */
export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
};

/**
 * Set notification sound state and notify active listeners.
 */
export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    window.dispatchEvent(
      new CustomEvent('mephisto-sound-toggle', {
        detail: { enabled },
      })
    );
  } catch (e) {
    console.warn('Failed to save sound preference:', e);
  }
};

/**
 * Toggle sound setting and return new state.
 */
export const toggleSound = (): boolean => {
  const current = isSoundEnabled();
  const next = !current;
  setSoundEnabled(next);
  return next;
};

/**
 * Play a subtle, elegant 2-tone harmonic chime using pure Web Audio API.
 * Uses envelope gain ramping and harmonic layering to prevent audio pops.
 */
export const playNotificationSound = (): void => {
  if (!isSoundEnabled() || typeof window === 'undefined') return;

  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;

    const ctx = new AudioCtxClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const startTime = ctx.currentTime + 0.02;

    // Master Gain for smooth volume control & zero clipping
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, startTime);
    masterGain.connect(ctx.destination);

    // ==========================================
    // Tone 1: Note D5 (~587.33 Hz) + harmonic overtone
    // ==========================================
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, startTime);

    // Soft attack & exponential decay envelope
    gain1.gain.setValueAtTime(0.0001, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.3, startTime + 0.025);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.38);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + 0.4);

    // Tone 1 subtle overtone (1174.66 Hz) for bell-like brightness
    const osc1Overtone = ctx.createOscillator();
    const gain1Overtone = ctx.createGain();
    osc1Overtone.type = 'sine';
    osc1Overtone.frequency.setValueAtTime(1174.66, startTime);
    gain1Overtone.gain.setValueAtTime(0.0001, startTime);
    gain1Overtone.gain.exponentialRampToValueAtTime(0.08, startTime + 0.02);
    gain1Overtone.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);
    osc1Overtone.connect(gain1Overtone);
    gain1Overtone.connect(masterGain);

    osc1Overtone.start(startTime);
    osc1Overtone.stop(startTime + 0.26);

    // ==========================================
    // Tone 2: Note A5 (880 Hz) + harmonic overtone (0.11s delay)
    // ==========================================
    const tone2Time = startTime + 0.11;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, tone2Time);

    // Warm, lingering bell tail
    gain2.gain.setValueAtTime(0.0001, tone2Time);
    gain2.gain.exponentialRampToValueAtTime(0.35, tone2Time + 0.025);
    gain2.gain.exponentialRampToValueAtTime(0.0001, tone2Time + 0.55);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc2.start(tone2Time);
    osc2.stop(tone2Time + 0.58);

    // Tone 2 overtone (1760 Hz)
    const osc2Overtone = ctx.createOscillator();
    const gain2Overtone = ctx.createGain();
    osc2Overtone.type = 'sine';
    osc2Overtone.frequency.setValueAtTime(1760.00, tone2Time);
    gain2Overtone.gain.setValueAtTime(0.0001, tone2Time);
    gain2Overtone.gain.exponentialRampToValueAtTime(0.09, tone2Time + 0.02);
    gain2Overtone.gain.exponentialRampToValueAtTime(0.0001, tone2Time + 0.35);
    osc2Overtone.connect(gain2Overtone);
    gain2Overtone.connect(masterGain);

    osc2Overtone.start(tone2Time);
    osc2Overtone.stop(tone2Time + 0.36);

    // Safely close context after completion to release audio resources
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      } catch {}
    }, 850);
  } catch (err) {
    console.debug('AudioContext notification chime playback suppressed:', err);
  }
};
