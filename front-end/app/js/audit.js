import { AuditApi } from "./api.js";
import { formatDate, escapeHtml } from "./ui.js";

// Todo /audit exige rol admin o root (audit.controller.ts, guard de clase),
// no hay ningún endpoint público en este microservicio.

const ACCION_CLASS = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-brand-100 text-brand-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-violet-100 text-violet-800",
  LOGOUT: "bg-slate-100 text-slate-800",
  SELECT: "bg-amber-100 text-amber-800",
};

function filaEvento(ev) {
  return `
    <tr class="border-b border-slate-100">
      <td class="px-3 py-2 text-sm whitespace-nowrap">${formatDate(ev.timestamp)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(ev.servicio)}</td>
      <td class="px-3 py-2 text-sm">
        <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${ACCION_CLASS[ev.action] || "bg-slate-100 text-slate-800"}">${escapeHtml(ev.action)}</span>
      </td>
      <td class="px-3 py-2 text-sm">${escapeHtml(ev.entidad)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(ev.username || "—")}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(ev.rol || "—")}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(ev.ip || "—")}</td>
    </tr>`;
}

async function recargarAuditoria() {
  const tbody = document.getElementById("auditTbody");
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500">Cargando…</td></tr>`;

  const eventos = (await AuditApi.getAll()) || [];
  // Más recientes primero.
  eventos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  tbody.innerHTML =
    eventos.length === 0
      ? `<tr><td colspan="7" class="text-center py-6 text-slate-500">Sin eventos registrados</td></tr>`
      : eventos.map(filaEvento).join("");
}

export function initAuditTab() {
  recargarAuditoria();
}
