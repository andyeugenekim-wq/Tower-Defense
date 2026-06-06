let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, volume = 0.04): void {
  const ctx = getContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.stop(ctx.currentTime + duration);
}

export function playShootSound(): void {
  playTone(520, 0.05, 0.025);
}

export function playHitSound(): void {
  playTone(180, 0.08, 0.03);
}

export function playKillSound(): void {
  playTone(880, 0.12, 0.035);
}

export function playWaveCompleteSound(): void {
  playTone(660, 0.1, 0.04);
  setTimeout(() => playTone(880, 0.15, 0.04), 100);
}

export function resumeAudio(): void {
  const ctx = getContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
}
