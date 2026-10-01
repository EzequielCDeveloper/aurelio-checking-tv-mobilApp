/**
 * Genera el avatar placeholder como PNG (256x256 RGBA).
 *
 * El prototipo lo bajaba de `lh3.googleusercontent.com`, una URL atada a la
 * sesion de Google que devuelve 403 al dia siguiente. Un asset local nunca
 * se rompe y ademas funciona sin conexion.
 *
 * Correr: node scripts/generate-avatar.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 256;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'avatar.png');

// --- PNG container -----------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

// --- Dibujo ------------------------------------------------------------------

/** Anti-aliase por supersampling 2x2 sobre un lado de la mascara. */
const coverage = (x, y, inside) => {
  let hits = 0;
  for (const dx of [0.25, 0.75]) {
    for (const dy of [0.25, 0.75]) {
      if (inside(x + dx, y + dy)) hits++;
    }
  }
  return hits / 4;
};

const headInside = (x, y) => (x - 128) ** 2 + (y - 100) ** 2 <= 42 ** 2;
const shoulderInside = (x, y) => {
  if (y < 150) return false;
  const t = (y - 150) / 90;
  if (t > 1) return false;
  // Semielipse que se ensancha hacia abajo.
  const halfWidth = 38 + 46 * Math.sin((Math.min(t, 0.999) * Math.PI) / 2);
  return Math.abs(x - 128) <= halfWidth;
};

const mix = (a, b, t) => a + (b - a) * t;

const rows = [];
for (let y = 0; y < SIZE; y++) {
  const row = Buffer.alloc(1 + SIZE * 4);
  row[0] = 0; // filtro PNG "None"
  for (let x = 0; x < SIZE; x++) {
    // Fondo: degradado vertical del azul de marca.
    const t = y / SIZE;
    let r = mix(0x00, 0x00, t);
    let g = mix(0x52, 0x3a, t);
    let b = mix(0xff, 0xab, t);

    const silhouette = Math.max(coverage(x, y, headInside), coverage(x, y, shoulderInside));
    if (silhouette > 0) {
      r = mix(r, 0xff, silhouette);
      g = mix(g, 0xff, silhouette);
      b = mix(b, 0xff, silhouette);
    }

    const i = 1 + x * 4;
    row[i] = Math.round(r);
    row[i + 1] = Math.round(g);
    row[i + 2] = Math.round(b);
    row[i + 3] = 255;
  }
  rows.push(row);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bits por canal
ihdr[9] = 6; // RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log(`avatar.png  ${SIZE}x${SIZE}  ${(png.length / 1024).toFixed(1)} KB`);
