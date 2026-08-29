/** Client-side synthesized email notification chime. */

const SOUND_STORAGE_KEY = 'mephisto_sound_enabled';
let sharedAudioContext: AudioContext | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch { return true; }
};

export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('mephisto-sound-toggle', { detail: { enabled } }));
  } catch (e) { console.warn('Failed to save sound preference:', e); }
};

export const toggleSound = (): boolean => {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') sharedAudioContext = new AudioCtxClass();
    return sharedAudioContext;
  } catch { return null; }
};

export const playNotificationSound = (): void => {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    const startTime = ctx.currentTime + 0.02;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, startTime);
    masterGain.connect(ctx.destination);

    const addTone = (frequency: number, at: number, duration: number, peak: number, overtone = false) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(gain); gain.connect(masterGain);
      osc.start(at); osc.stop(at + duration + 0.01);
    };

    addTone(587.33, startTime, 0.38, 0.3);
    addTone(1174.66, startTime, 0.25, 0.08, true);
    addTone(880, startTime + 0.11, 0.55, 0.35);
    addTone(1760, startTime + 0.11, 0.35, 0.09, true);

    closeTimer = setTimeout(() => {
      // Keep the shared context alive so repeated notifications don't create
      // a new native AudioContext each time; close only when the browser does.
      closeTimer = null;
    }, 900);
  } catch (err) { console.debug('Audio notification suppressed:', err); }
};
