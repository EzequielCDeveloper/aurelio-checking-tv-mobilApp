import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { AttendanceRecord, UserProfile } from '@/types';
import { formatShortDate, formatTime } from './date';

/** Escapa HTML. El prototipo concatenaba datos crudos y un "&" rompia el reporte. */
const esc = (value: string | number) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const STATUS_STYLE: Record<AttendanceRecord['status'], string> = {
  Puntual: 'background:#dcfce7;color:#166534;',
  Retardo: 'background:#fee2e2;color:#991b1b;',
  Registrado: 'background:#f1f5f9;color:#334155;',
};

function buildReportHtml(records: AttendanceRecord[], user: UserProfile): string {
  const rows = records
    .map(
      (r) => `
      <tr>
        <td class="mono">${esc(formatShortDate(r.timestamp))}</td>
        <td class="strong">${esc(r.title)}</td>
        <td class="mono">${esc(formatTime(r.timestamp))}</td>
        <td><span class="pill" style="${STATUS_STYLE[r.status]}">${esc(r.status)}</span></td>
        <td class="muted">${esc(r.location)}</td>
        <td class="mono hash">${esc(r.hash.slice(0, 16))}...</td>
      </tr>`,
    )
    .join('');

  const emittedAt = new Date();

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reporte de Asistencia - BioCheck Sentinel</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #fff; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0052ff; padding-bottom: 16px; margin-bottom: 24px; }
  .logo-text { font-size: 10px; letter-spacing: 0.12em; color: #0052ff; font-weight: 700; text-transform: uppercase; }
  .title { font-size: 22px; font-weight: 700; margin: 4px 0 0; }
  .badge { font-size: 10px; font-family: Menlo, monospace; background: #eff6ff; color: #1d4ed8; padding: 6px 10px; border-radius: 6px; border: 1px solid #bfdbfe; white-space: nowrap; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 22px; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 3px; letter-spacing: 0.05em; }
  .meta-val { font-size: 13px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; background: #f8fafc; }
  td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .mono { font-family: Menlo, monospace; }
  .strong { font-weight: 600; }
  .muted { color: #64748b; font-size: 12px; }
  .hash { color: #0284c7; font-size: 10px; }
  .pill { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
  .empty { padding: 28px; text-align: center; color: #94a3b8; border: 1px dashed #cbd5e1; border-radius: 10px; }
  .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @page { margin: 16mm; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-text">BioCheck Sentinel Enterprise</div>
      <h1 class="title">Reporte de Asistencia</h1>
    </div>
    <div class="badge">SHA-256 VERIFICADO</div>
  </div>

  <div class="meta">
    <div class="meta-item"><div class="meta-label">Colaborador</div><div class="meta-val">${esc(user.name)}</div></div>
    <div class="meta-item"><div class="meta-label">ID de Nomina</div><div class="meta-val">${esc(user.id)}</div></div>
    <div class="meta-item"><div class="meta-label">Area / Puesto</div><div class="meta-val">${esc(user.role)}</div></div>
    <div class="meta-item"><div class="meta-label">Nivel de Seguridad</div><div class="meta-val">${esc(user.securityLevel)}</div></div>
  </div>

  ${
    records.length === 0
      ? '<div class="empty">No hay marcajes registrados en el periodo.</div>'
      : `<table>
    <thead><tr>
      <th>Fecha</th><th>Evento</th><th>Hora</th><th>Estatus</th><th>Ubicacion / Dispositivo</th><th>Firma</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`
  }

  <div class="footer">
    <div>BioCheck Sentinel v1.0.0</div>
    <div>Emision: ${esc(emittedAt.toLocaleString('es-MX'))}</div>
  </div>
</body>
</html>`;
}

export interface ExportResult {
  uri: string;
  pageCount: number;
}

/**
 * Genera un PDF real y lo abre en el selector de compartir del sistema.
 *
 * El prototipo abria `window.open()` con HTML y delegaba en `window.print()`.
 * En nativo, expo-print rasteriza a PDF de verdad y expo-sharing lo pasa a
 * correo, WhatsApp o Drive.
 */
export async function exportAttendanceReport(
  records: AttendanceRecord[],
  user: UserProfile,
): Promise<ExportResult | null> {
  const { uri } = await Print.printToFileAsync({
    html: buildReportHtml(records, user),
  });

  if (!(await Sharing.isAvailableAsync())) {
    return { uri, pageCount: records.length };
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Reporte de Asistencia',
    UTI: 'com.adobe.pdf',
  });

  return { uri, pageCount: records.length };
}
