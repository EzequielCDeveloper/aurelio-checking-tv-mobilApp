/**
 * Formato del QR del terminal: `BIOCHECK:<terminalId>:<userId>`
 *
 * El prototipo aceptaba cualquier lectura del visor y escribia un registro
 * con contenido fijo. Acá el string se parsea y se contrasta contra el
 * terminal y el usuario de la sesion; un QR de otra sede no pasa.
 */
export const QR_PREFIX = 'BIOCHECK';

export type ScanRejection =
  | { ok: false; reason: 'malformed'; detail: string }
  | { ok: false; reason: 'unknown-terminal'; detail: string }
  | { ok: false; reason: 'user-mismatch'; detail: string };

export type ScanAcceptance = {
  ok: true;
  terminalId: string;
  userId: string;
};

export type ScanResult = ScanAcceptance | ScanRejection;

export function parseQrPayload(raw: string): ScanResult {
  const parts = raw.trim().split(':');

  if (parts.length !== 3 || parts[0] !== QR_PREFIX) {
    return {
      ok: false,
      reason: 'malformed',
      detail: 'El codigo no tiene el formato de BioCheck.',
    };
  }

  const [, terminalId, userId] = parts;
  if (!terminalId || !userId) {
    return { ok: false, reason: 'malformed', detail: 'El codigo esta incompleto.' };
  }

  return { ok: true, terminalId, userId };
}

/** Valida el QR contra la sesion actual. */
export function validateScan(raw: string, expected: { terminalId: string; userId: string }): ScanResult {
  const parsed = parseQrPayload(raw);
  if (!parsed.ok) return parsed;

  if (parsed.terminalId !== expected.terminalId) {
    return {
      ok: false,
      reason: 'unknown-terminal',
      detail: `Este codigo pertenece a ${parsed.terminalId}, no a ${expected.terminalId}.`,
    };
  }

  if (parsed.userId !== expected.userId) {
    return {
      ok: false,
      reason: 'user-mismatch',
      detail: 'La credencial no corresponde a tu numero de nomina.',
    };
  }

  return parsed;
}
