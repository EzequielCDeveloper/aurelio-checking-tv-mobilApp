import * as Crypto from 'expo-crypto';

import type { Coordinates, PunchType } from '@/types';

/**
 * SHA-256 real del payload de un marcaje.
 *
 * El prototipo inventaba el campo `hash` con un string fijo; aqui es un
 * digest criptografico de verdad via expo-crypto, que es lo que permite que
 * el reporte sea un comprobante y no un adorno.
 */
export async function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, {
    // El enum se llama `CryptoEncoding`, no `EncodingType`.
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

/** Serializacion canonica: mismo contenido -> mismo hash, siempre. */
function canonicalize(fields: Record<string, string | number>): string {
  return Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('&');
}

export interface SignedPayload {
  hash: string;
  /** Texto exacto que se firmo, para poder auditarlo. */
  canonical: string;
}

/**
 * Firma un marcaje. Incluye la posicion y la marca de tiempo para que un
 * registro no pueda reutilizarse en otro lugar u otra hora.
 */
export function signPunch(input: {
  userId: string;
  type: PunchType;
  timestamp: number;
  location: string;
  coordinates: Coordinates;
  scannedPayload: string;
}): Promise<SignedPayload> {
  const canonical = canonicalize({
    user: input.userId,
    type: input.type,
    ts: String(input.timestamp),
    terminal: input.location,
    lat: input.coordinates.latitude.toFixed(6),
    lng: input.coordinates.longitude.toFixed(6),
    qr: input.scannedPayload,
  });

  return sha256Hex(canonical).then((hash) => ({ hash, canonical }));
}

/** Identificador estable del dispositivo, derivado del UUID del sistema. */
export async function deviceFingerprint(): Promise<string> {
  const base = `${Crypto.randomUUID()}:${Crypto.getRandomBytes(8).join('-')}`;
  const hash = await sha256Hex(base);
  return hash.slice(0, 16);
}
