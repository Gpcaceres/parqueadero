import { TicketsApi, EspaciosApi } from "./api.js";
import { EP } from "./config.js";
import { getCurrentUser, isEmpleado } from "./session.js";
import { formatDate, formatearMoneda, escapeHtml, BADGE_CLASS_POR_ESTADO } from "./ui.js";
import { abrirModalAnular } from "./ticket-modal.js";

const ESTADO_TICKET_CLASS = {
  activo: "bg-green-200 text-green-800",
  pagado: "bg-brand-200 text-brand-800",
  anulado: "bg-slate-200 text-slate-800",
};

let mapaEspaciosCache = null;
async function codigoEspacio(idEspacio) {
  if (!mapaEspaciosCache) {
    const espacios = (await EspaciosApi.getAll()) || [];
    mapaEspaciosCache = new Map(espacios.map((e) => [e.idEspacio, e.codigo]));
  }
  return mapaEspaciosCache.get(idEspacio) || idEspacio.slice(0, 8);
}

function filaTicket(ticket, codigo, conAcciones) {
  const botonAnular =
    conAcciones && ticket.estado_ticket === "activo"
      ? `<button data-action="anular" data-ticket-id="${ticket.id_ticket}"
             class="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-1 transition-colors">Anular</button>`
      : "";
  // Mismo endpoint que abre solo al registrar la salida (ver
  // ticket-modal.js#registrarSalida) -- aquí sirve para reimprimir el
  // recibo de cualquier ticket, este o no ya pagado.
  const botonRecibo = `<a href="${EP.tickets}/${ticket.id_ticket}/recibo" target="_blank"
       class="text-xs font-semibold bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1 transition-colors">Recibo</a>`;
  const acciones = `<div class="flex gap-2">${botonRecibo}${botonAnular}</div>`;

  return `
    <tr class="border-b border-slate-100">
      <td class="px-3 py-2 text-sm">${escapeHtml(codigo)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(ticket.id_vehiculo)} <span class="text-slate-400">(${escapeHtml(ticket.tipo_vehiculo)})</span></td>
      <td class="px-3 py-2 text-sm">${formatDate(ticket.fecha_hora_ingreso)}</td>
      <td class="px-3 py-2 text-sm">${ticket.fecha_hora_salida ? formatDate(ticket.fecha_hora_salida) : "—"}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(ticket.tipo_tarifa)}</td>
      <td class="px-3 py-2 text-sm">
        <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${ESTADO_TICKET_CLASS[ticket.estado_ticket] || ""}">
          ${escapeHtml(ticket.estado_ticket)}
        </span>
      </td>
      <td class="px-3 py-2 text-sm font-semibold">${formatearMoneda(ticket.valor_recaudado)}</td>
      <td class="px-3 py-2 text-sm">${acciones}</td>
    </tr>`;
}

function tarjetaEstadistica(etiqueta, valor, clase) {
  return `
    <div class="bg-white rounded-lg shadow p-4 text-center">
      <div class="text-2xl font-bold ${clase}">${valor}</div>
      <div class="text-xs text-slate-500 mt-1">${etiqueta}</div>
    </div>`;
}

async function renderEstadisticas() {
  const stats = await TicketsApi.getEstadisticas();
  const cont = document.getElementById("ticketsEstadisticas");
  cont.innerHTML = [
    tarjetaEstadistica("Activos", stats.activos, "text-green-600"),
    tarjetaEstadistica("Pagados", stats.pagados, "text-brand-600"),
    tarjetaEstadistica("Anulados", stats.anulados, "text-slate-600"),
    tarjetaEstadistica("Total", stats.total, "text-slate-800"),
    tarjetaEstadistica("Recaudado", formatearMoneda(stats.totalRecaudado), "text-emerald-600"),
  ].join("");
  cont.classList.remove("hidden");
}

async function renderTabla(tickets, conAcciones) {
  const tbody = document.getElementById("ticketsTbody");
  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-500">Sin tickets para mostrar</td></tr>`;
    return;
  }
  const filas = await Promise.all(
    tickets.map(async (t) => filaTicket(t, await codigoEspacio(t.id_espacio), conAcciones)),
  );
  tbody.innerHTML = filas.join("");
}

// Habilita "Generar reporte" solo cuando hay un rango completo elegido, y
// apunta al mismo período que se está filtrando en la tabla.
function actualizarBotonReporte(desde, hasta) {
  const boton = document.getElementById("btnReporteTickets");
  if (desde && hasta) {
    boton.href = TicketsApi.urlReporte(desde, hasta);
    boton.classList.remove("pointer-events-none", "opacity-50");
  } else {
    boton.href = "#";
    boton.classList.add("pointer-events-none", "opacity-50");
  }
}

async function cargarConFiltro() {
  const desde = document.getElementById("ticketsFechaDesde").value || undefined;
  const hasta = document.getElementById("ticketsFechaHasta").value || undefined;
  const info = document.getElementById("ticketsFiltroInfo");

  actualizarBotonReporte(desde, hasta);

  const tickets = await TicketsApi.getAll(desde, hasta);
  await renderTabla(tickets, true);

  if (desde || hasta) {
    info.textContent = `Mostrando ${tickets.length} ticket${tickets.length === 1 ? "" : "s"} entre ${desde || "el inicio"} y ${hasta || "hoy"}.`;
    info.classList.remove("hidden");
  } else {
    info.classList.add("hidden");
  }
}

export async function cargarTicketsTab() {
  const titulo = document.getElementById("ticketsTitulo");
  const empleado = isEmpleado();

  if (empleado) {
    titulo.textContent = "Todos los tickets";
    document.getElementById("ticketsFiltroFecha").classList.remove("hidden");
    await renderEstadisticas();
    await cargarConFiltro();
  } else {
    titulo.textContent = "Mis tickets";
    document.getElementById("ticketsFiltroFecha").classList.add("hidden");
    document.getElementById("ticketsEstadisticas").classList.add("hidden");
    const tickets = await TicketsApi.getByUser(getCurrentUser().id_user);
    await renderTabla(tickets, false);
  }
}

let inicializado = false;
export function initTicketsTab() {
  if (!inicializado) {
    inicializado = true;
    document.getElementById("ticketsTbody").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='anular']");
      if (btn) abrirModalAnular(btn.dataset.ticketId, () => cargarTicketsTab());
    });

    document.getElementById("btnFiltrarTickets").addEventListener("click", cargarConFiltro);
    document.getElementById("btnLimpiarFiltroTickets").addEventListener("click", () => {
      document.getElementById("ticketsFechaDesde").value = "";
      document.getElementById("ticketsFechaHasta").value = "";
      cargarConFiltro();
    });
  }
  cargarTicketsTab();
}
