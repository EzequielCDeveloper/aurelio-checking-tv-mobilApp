/**
 * Genera los efectos de sonido de BioCheck Sentinel como WAV 16-bit PCM mono.
 *
 * El prototipo web los sintetizaba en runtime con Web Audio API. En nativo no
 * hay equivalente: expo-audio reproduce archivos. Este script replica la misma
 * matematica de osciladores (misma frecuencia, misma envolvente, mismo timing)
 * y la congela en .wav, de modo que el sonido es identico al del prototipo.
 *
 * Correr: npm run gen:sounds
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'sounds');

/** Rampa exponencial, equivalente a AudioParam.exponentialRampToValueAtTime. */
const expRamp = (t, t0, t1, from, to) => from * Math.pow(to / from, (t - t0) / (t1 - t0));

const sine = (p) => Math.sin(p);
const triangle = (p) => 2 * Math.abs(2 * (p / (2 * Math.PI) - Math.floor(0.5 + p / (2 * Math.PI)))) - 1;

/**
 * Un tono: portadora con barrido de frecuencia opcional + envolvente
 * exponencial de ataque instantaneo.
 *
 * La fase se integra muestra a muestra en vez de calcularse en closed form:
 * un barrido exponencial de frecuencia (880 -> 1760 Hz) no tiene integral
 * elemental, y la formulacion directa arrastraba un NaN en la muestra 0.
 *
 * t0 es el instante de ataque: antes de el la salida es silencio. Sin este
 * corte la rampa exponencial se evalua con exponente negativo y la envolvente
 * crece en vez de callar.
 */
function tone({ wave, f0, f1, fRamp = 0, t0, t1, gainStart, gainEnd, duration }) {
  const samples = new Float32Array(Math.ceil(duration * SAMPLE_RATE));
  const shape = wave === 'triangle' ? triangle : sine;
  let phase = 0;

  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    if (t < t0) continue;
    const freq = fRamp > 0 ? f0 * Math.pow(f1 / f0, Math.min(t - t0, fRamp) / fRamp) : f0;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    samples[i] = shape(phase) * expRamp(t, t0, t1, gainStart, gainEnd);
  }
  return samples;
}

function mixInto(target, source, offsetSeconds) {
  const offset = Math.floor(offsetSeconds * SAMPLE_RATE);
  for (let i = 0; i < source.length; i++) {
    const j = offset + i;
    if (j >= 0 && j < target.length) target[j] += source[i];
  }
}

function toWav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const clipped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clipped * 32767), 44 + i * 2);
  }
  return buf;
}

const seconds = (n) => new Float32Array(Math.ceil(n * SAMPLE_RATE));

const sounds = {
  // Ping biometrico: barrido 880 -> 1760 Hz en 80 ms, caida en 120 ms.
  'scan-ping': (() => {
    const out = seconds(0.16);
    mixInto(out, tone({ wave: 'sine', f0: 880, f1: 1760, fRamp: 0.08, t0: 0, t1: 0.12, gainStart: 0.08, gainEnd: 0.001, duration: 0.16 }), 0);
    return out;
  })(),

  // Confirmacion en arpegio: D5 triangular, A5 y D6 senoidales desplazados.
  // El desplazamiento ya va dentro de cada tono via t0, asi que aqui todo se
  // mezcla en offset 0 (igual que las scheduleTime del Web Audio original).
  success: (() => {
    const out = seconds(0.68);
    mixInto(out, tone({ wave: 'triangle', f0: 587.33, t0: 0, t1: 0.25, gainStart: 0.1, gainEnd: 0.001, duration: 0.28 }), 0);
    mixInto(out, tone({ wave: 'sine', f0: 880, t0: 0.1, t1: 0.45, gainStart: 0.12, gainEnd: 0.001, duration: 0.38 }), 0);
    mixInto(out, tone({ wave: 'sine', f0: 1174.66, t0: 0.2, t1: 0.6, gainStart: 0.08, gainEnd: 0.001, duration: 0.42 }), 0);
    return out;
  })(),

  // Tick tactil de boton: 1200 Hz, 30 ms.
  tick: (() => {
    const out = seconds(0.05);
    mixInto(out, tone({ wave: 'sine', f0: 1200, t0: 0, t1: 0.03, gainStart: 0.04, gainEnd: 0.001, duration: 0.05 }), 0);
    return out;
  })(),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  const path = join(OUT_DIR, `${name}.wav`);
  writeFileSync(path, toWav(samples));
  console.log(`${name}.wav  ${(samples.length / SAMPLE_RATE).toFixed(2)}s  ${(samples.length * 2 + 44) / 1024} KB`);
}
