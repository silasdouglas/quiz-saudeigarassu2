// Synthesized quiz feedback sounds via Web Audio API — no asset files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Browsers may suspend the context until a user gesture resumes it.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  audio: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType,
  peak: number
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

/** Pleasant rising two-note chime for a correct answer. */
export function playCorrect() {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  tone(audio, 587.33, t, 0.18, "triangle", 0.25); // D5
  tone(audio, 880, t + 0.12, 0.28, "triangle", 0.25); // A5
}

/** Low buzzy descending tone for a wrong answer. */
export function playWrong() {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  tone(audio, 220, t, 0.22, "sawtooth", 0.18); // A3
  tone(audio, 155.56, t + 0.14, 0.3, "sawtooth", 0.18); // D#3
}

/** Resume the audio context on a user gesture so later sounds can play. */
export function primeAudio() {
  getCtx();
}
