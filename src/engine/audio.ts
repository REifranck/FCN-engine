// FCN NEXT ENGINE — Procedural Web Audio synthesizer (no asset files)
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicNodes: { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode; interval?: number } | null = null;

function ensure(): AudioContext {
  if (!ctx) {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function envBeep(freqStart: number, freqEnd: number, dur: number, type: OscillatorType = "sine", vol = 0.3) {
  const c = ensure();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqStart, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(master!);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

export const SFX = {
  coin() {
    envBeep(1200, 1800, 0.08, "sine", 0.25);
    setTimeout(() => envBeep(1800, 2400, 0.1, "sine", 0.22), 70);
  },
  hit() {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = 0.5;
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 400;
    src.connect(filt).connect(g).connect(master!);
    src.start();
    envBeep(180, 40, 0.35, "sawtooth", 0.4);
  },
  jump() {
    envBeep(320, 880, 0.18, "square", 0.22);
  },
  click() {
    envBeep(900, 700, 0.05, "triangle", 0.2);
  },
  place() {
    envBeep(600, 1200, 0.09, "triangle", 0.22);
  },
};

export function startMusic() {
  if (musicNodes) return;
  const c = ensure();
  const g = c.createGain();
  g.gain.value = 0.12;
  g.connect(master!);
  const osc = c.createOscillator();
  osc.type = "square";
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfoGain.gain.value = 8;
  lfo.frequency.value = 5;
  lfo.connect(lfoGain).connect(osc.frequency);
  osc.connect(g);
  osc.start();
  lfo.start();
  const notes = [262, 330, 392, 523, 392, 330, 294, 247];
  let i = 0;
  const interval = window.setInterval(() => {
    osc.frequency.setValueAtTime(notes[i % notes.length], c.currentTime);
    i++;
  }, 280);
  musicNodes = { osc, gain: g, lfo, interval };
}

export function stopMusic() {
  if (!musicNodes) return;
  if (musicNodes.interval) clearInterval(musicNodes.interval);
  try { musicNodes.osc.stop(); musicNodes.lfo?.stop(); } catch { /* ignore */ }
  musicNodes.gain.disconnect();
  musicNodes = null;
}
