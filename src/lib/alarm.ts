// Web Audio alarm beep sequence (3 beeps, 0.3s, 440Hz).
// Loops while playing. stop() halts everything.

let ctx: AudioContext | null = null;
let timeout: number | null = null;
let stopped = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

function playSequence() {
  const ac = getCtx();
  if (!ac || stopped) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});

  const start = ac.currentTime;
  const beepDur = 0.3;
  const gap = 0.15;
  for (let i = 0; i < 3; i++) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    const t0 = start + i * (beepDur + gap);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.4, t0 + 0.02);
    gain.gain.setValueAtTime(0.4, t0 + beepDur - 0.05);
    gain.gain.linearRampToValueAtTime(0, t0 + beepDur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + beepDur + 0.01);
  }
  // Schedule next loop ~2s later
  timeout = window.setTimeout(playSequence, 2000);
}

export function startAlarm() {
  stopped = false;
  playSequence();
  // Try haptics
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate([200, 100, 200, 100, 200]); } catch {}
  }
}

export function stopAlarm() {
  stopped = true;
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
}

export function haptic(pattern: number | number[] = 30) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
}
