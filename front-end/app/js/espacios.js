import { EP } from "./config.js";
import { fetchJsonSilent, ReservasApi, EspaciosApi } from "./api.js";
import { isEmpleado } from "./session.js";
import {
  BADGE_CLASS_POR_ESTADO,
  formatDate,
  formatearDuracion,
  calcularValorEnCurso,
  formatearMoneda,
  escapeHtml,
  toast,
  confirmarAccion,
} from "./ui.js";
import { abrirModalCrearTicket, registrarSalida, abrirModalAnular } from "./ticket-modal.js";
import { abrirModalReservar } from "./reserva-modal.js";

let container, totalSpan, lastUpdateSpan, indicator, statusText, resumenDiv;
let espaciosCache = [];

// Mismo lenguaje de color que ya usan las tarjetas (bg-disponible, etc. en
// app.css) -- el resumen es solo una vista agregada del mismo estado, no un
// concepto nuevo, así que reutiliza exactamente esas clases.
const ORDEN_ESTADOS = ["DISPONIBLE", "OCUPADO", "RESERVADO", "MANTENIMIENTO", "INACTIVO"];
const ICONO_POR_ESTADO = {
  DISPONIBLE: "🟢",
  OCUPADO: "🔴",
  RESERVADO: "🟣",
  MANTENIMIENTO: "🟠",
  INACTIVO: "⚪",
};
const ETIQUETA_POR_ESTADO = {
  DISPONIBLE: "Disponibles",
  OCUPADO: "Ocupados",
  RESERVADO: "Reservados",
  MANTENIMIENTO: "Mantenimiento",
  INACTIVO: "Inactivos",
};

const renderizarResumen = (espacios) => {
  if (!resumenDiv) return;
  if (!espacios || espacios.length === 0) {
    resumenDiv.innerHTML = "";
    return;
  }
  const conteo = Object.fromEntries(ORDEN_ESTADOS.map((e) => [e, 0]));
  espacios.forEach((esp) => {
    if (conteo[esp.estadoEspacio] !== undefined) conteo[esp.estadoEspacio]++;
  });

  resumenDiv.innerHTML = ORDEN_ESTADOS.map(
    (estado) => `
        <div class="espacio-card bg-${estado.toLowerCase()} p-4 flex items-center gap-3">
            <span class="text-2xl leading-none">${ICONO_POR_ESTADO[estado]}</span>
            <div>
                <div class="text-2xl font-extrabold text-slate-800 leading-none">${conteo[estado]}</div>
                <div class="text-xs font-semibold text-slate-500 mt-1">${ETIQUETA_POR_ESTADO[estado]}</div>
            </div>
        </div>`,
  ).join("");
};

const setConnectionStatus = (connected) => {
  if (connected) {
    indicator.className = "w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse";
    statusText.textContent = "Conectado";
  } else {
    indicator.className = "w-2 h-2 bg-red-500 rounded-full inline-block";
    statusText.textContent = "Desconectado";
  }
};

// El servicio de zonas no incluye el nombre de la zona en cada espacio, así
// que se resuelve aparte con un mapa idZona -> nombre.
const obtenerMapaZonas = async () => {
  const zonas = await fetchJsonSilent(EP.zonas);
  const mapa = new Map();
  (zonas || []).forEach((zona) => mapa.set(zona.idZona, zona.nombre));
  return mapa;
};

// Para cada espacio OCUPADO se busca su ticket activo (ms-tickets ya lo
// enriquece con nombre_usuario). Los demás estados no tienen ticket que
// mostrar, así que no se consultan.
const obtenerMapaTickets = async (espacios) => {
  const ocupados = espacios.filter((esp) => esp.estadoEspacio === "OCUPADO");
  const tickets = await Promise.all(
    ocupados.map((esp) => fetchJsonSilent(`${EP.tickets}/espacio/${esp.idEspacio}`)),
  );
  const mapa = new Map();
  ocupados.forEach((esp, i) => {
    if (tickets[i]) mapa.set(esp.idEspacio, tickets[i]);
  });
  return mapa;
};

// Para cada espacio RESERVADO se busca la reserva activa, ya enriquecida
// con el contacto de quien reservó (ver ReservasController.findByEspacio) --
// así el personal sabe a quién esperar y puede confirmarle la llegada.
const obtenerMapaReservas = async (espacios) => {
  const reservados = espacios.filter((esp) => esp.estadoEspacio === "RESERVADO");
  const reservas = await Promise.all(
    reservados.map((esp) => fetchJsonSilent(`${EP.reservas}/espacio/${esp.idEspacio}`)),
  );
  const mapa = new Map();
  reservados.forEach((esp, i) => {
    if (reservas[i]) mapa.set(esp.idEspacio, reservas[i]);
  });
  return mapa;
};

const actualizarContadores = () => {
  const ahora = Date.now();
  document.querySelectorAll(".contador-tiempo").forEach((el) => {
    const ingreso = new Date(el.dataset.ingreso).getTime();
    el.textContent = formatearDuracion(ahora - ingreso);
  });
  document.querySelectorAll(".valor-en-curso").forEach((el) => {
    const ingreso = new Date(el.dataset.ingreso).getTime();
    const valor = calcularValorEnCurso(el.dataset.tarifa, ingreso, ahora);
    el.textContent = formatearMoneda(valor);
  });
};

const renderizarTarjetaEspacio = (esp, nombreZona, ticket, reserva) => {
  const estado = esp.estadoEspacio;
  const estadoClass = `bg-${estado.toLowerCase()}`;
  const puedeOperar = isEmpleado();

  // El cliente ve solo el estado del espacio, nunca los datos de otro
  // cliente (nombre, placa, costo en curso) -- eso es exclusivo del
  // personal que efectivamente atiende ese ticket.
  const infoTicket = ticket && puedeOperar
    ? `
                <div class="mt-2 pt-2 border-t border-black/10 text-xs text-slate-700 space-y-0.5">
                    <div>👤 ${escapeHtml(ticket.nombre_usuario || "Usuario no disponible")}</div>
                    <div>🚗 ${escapeHtml(ticket.id_vehiculo)} · ${escapeHtml(ticket.tipo_vehiculo)}</div>
                    <div>🕐 Entrada: ${formatDate(ticket.fecha_hora_ingreso)}</div>
                    <div>⏱️ <span class="font-semibold contador-tiempo" data-ingreso="${ticket.fecha_hora_ingreso}">--:--:--</span></div>
                    <div>💲 En curso (${ticket.tipo_tarifa}):
                        <span class="font-semibold valor-en-curso" data-ingreso="${ticket.fecha_hora_ingreso}" data-tarifa="${ticket.tipo_tarifa}">--</span>
                    </div>
                </div>`
    : "";

  // Igual que con el ticket: solo el personal ve el contacto de quien
  // reservó (nombre, teléfono, email) y la hora a la que dijo que llegaba.
  const infoReserva = reserva && puedeOperar
    ? `
                <div class="mt-2 pt-2 border-t border-black/10 text-xs text-slate-700 space-y-0.5">
                    <div>👤 ${escapeHtml(reserva.contacto?.nombre || "Contacto no disponible")}</div>
                    ${reserva.contacto?.telefono ? `<div>📞 ${escapeHtml(reserva.contacto.telefono)}</div>` : ""}
                    ${reserva.contacto?.email ? `<div>✉️ ${escapeHtml(reserva.contacto.email)}</div>` : ""}
                    <div>🕐 Reservado para: ${formatDate(reserva.hora_reserva)}</div>
                </div>`
    : "";

  let acciones = "";
  if (puedeOperar && estado === "DISPONIBLE") {
    acciones = `
                <div class="mt-2 pt-2 border-t border-black/10">
                    <button data-action="crear-ticket" data-espacio-id="${esp.idEspacio}"
                        class="w-full text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded px-2 py-1.5">
                        Registrar ingreso
                    </button>
                </div>`;
  } else if (puedeOperar && estado === "RESERVADO") {
    // "Confirmar llegada" completa la reserva: crea el ticket real con la
    // persona que reservó ya preseleccionada (sin tener que buscarla de
    // nuevo), si se pudo resolver su contacto. "Cancelar reserva" es para
    // cuando el cliente avisa que no llega, o el personal decide liberar el
    // espacio antes de que expire sola (ver ReservasController.cancelar,
    // restringido a admin/recaudador/root igual que el resto de estas acciones).
    acciones = `
                <div class="mt-2 pt-2 border-t border-black/10 flex gap-2">
                    <button data-action="crear-ticket" data-espacio-id="${esp.idEspacio}"
                        data-persona-id="${reserva?.id_usuario || ""}"
                        data-persona-nombre="${escapeHtml(reserva?.contacto?.nombre || "")}"
                        class="flex-1 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-2 py-1.5 transition-colors">
                        Confirmar llegada
                    </button>
                    ${reserva ? `
                    <button data-action="cancelar-reserva" data-reserva-id="${reserva.id_reserva}"
                        class="flex-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1.5 transition-colors">
                        Cancelar reserva
                    </button>` : `
                    <!-- Espacio marcado RESERVADO sin una reserva activa detrás (ej. se
                         forzó el estado a mano desde "Zonas y Espacios") -- no hay nada
                         que cancelar en /reservas, pero el personal igual necesita poder
                         liberarlo sin ir a otra pestaña. -->
                    <button data-action="liberar-espacio" data-espacio-id="${esp.idEspacio}"
                        title="Este espacio no tiene una reserva activa registrada; libéralo directamente."
                        class="flex-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2 py-1.5 transition-colors">
                        Liberar espacio
                    </button>`}
                </div>`;
  } else if (!puedeOperar && estado === "DISPONIBLE") {
    acciones = `
                <div class="mt-2 pt-2 border-t border-black/10">
                    <button data-action="reservar" data-espacio-id="${esp.idEspacio}"
                        class="w-full text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded px-2 py-1.5">
                        Reservar
                    </button>
                </div>`;
  } else if (puedeOperar && estado === "OCUPADO" && ticket) {
    acciones = `
                <div class="mt-2 pt-2 border-t border-black/10 flex gap-2">
                    <button data-action="registrar-salida" data-ticket-id="${ticket.id_ticket}"
                        class="flex-1 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded px-2 py-1.5">
                        Registrar salida
                    </button>
                    <button data-action="anular-ticket" data-ticket-id="${ticket.id_ticket}"
                        class="flex-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1.5">
                        Anular
                    </button>
                </div>`;
  }

  return `
            <div class="espacio-card ${estadoClass} rounded-lg shadow p-4 flex flex-col">
                <div class="font-bold text-lg text-slate-800">${escapeHtml(esp.codigo || "Sin código")}</div>
                <div class="text-sm text-slate-600">Zona: ${escapeHtml(nombreZona)}</div>
                <div class="text-sm text-slate-600">Tipo: ${escapeHtml(esp.tipo || "N/A")}</div>
                <div class="mt-2 flex items-center justify-between">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full
                        ${BADGE_CLASS_POR_ESTADO[estado] || "bg-yellow-200 text-yellow-800"}">
                        ${estado}
                    </span>
                    <span class="text-xs text-slate-400">ID: ${esp.idEspacio.slice(0, 8)}</span>
                </div>
                ${infoTicket}
                ${infoReserva}
                ${acciones}
            </div>
        `;
};

// Agrupa los espacios por zona para poder mostrar, junto al nombre de cada
// zona, cuántos de sus espacios están DISPONIBLE en este momento.
const agruparPorZona = (espacios, mapaZonas) => {
  const grupos = new Map();
  espacios.forEach((esp) => {
    const nombreZona = mapaZonas.get(esp.idZona) || "Sin zona";
    if (!grupos.has(esp.idZona)) {
      grupos.set(esp.idZona, { nombreZona, espacios: [] });
    }
    grupos.get(esp.idZona).espacios.push(esp);
  });
  return [...grupos.values()].sort((a, b) => a.nombreZona.localeCompare(b.nombreZona, "es"));
};

const renderizarEspacios = (espacios, mapaZonas, mapaTickets, mapaReservas) => {
  renderizarResumen(espacios);

  if (!espacios || espacios.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12 text-slate-500">
                <p class="text-xl">No hay espacios disponibles</p>
            </div>
        `;
    totalSpan.textContent = "0 espacios";
    return;
  }

  const grupos = agruparPorZona(espacios, mapaZonas);

  const html = grupos
    .map(({ nombreZona, espacios: espaciosZona }) => {
      const disponibles = espaciosZona.filter((e) => e.estadoEspacio === "DISPONIBLE").length;
      const tarjetas = espaciosZona
        .map((esp) =>
          renderizarTarjetaEspacio(
            esp,
            nombreZona,
            mapaTickets.get(esp.idEspacio),
            mapaReservas.get(esp.idEspacio),
          ),
        )
        .join("");

      return `
            <section>
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-xl font-semibold text-slate-800">Zona: ${escapeHtml(nombreZona)}</h2>
                    <span class="text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-800">
                        ${disponibles} disponible${disponibles === 1 ? "" : "s"} de ${espaciosZona.length}
                    </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    ${tarjetas}
                </div>
            </section>
        `;
    })
    .join("");

  container.innerHTML = html;
  totalSpan.textContent = `${espacios.length} espacios`;
  lastUpdateSpan.textContent = formatDate(new Date());
  actualizarContadores(); // evita el parpadeo "--:--:--" hasta el próximo tick
};

export const cargarEspacios = async () => {
  const [espacios, mapaZonas] = await Promise.all([fetchJsonSilent(EP.espacios), obtenerMapaZonas()]);
  if (espacios) {
    espaciosCache = espacios;
    // Un cliente no debe ver los datos de otros clientes (nombre, placa,
    // costo en curso, contacto de reserva) -- ni siquiera se piden: no solo
    // se ocultan en el render, para que el dato nunca llegue al navegador
    // de alguien sin permiso de verlo.
    const [mapaTickets, mapaReservas] = isEmpleado()
      ? await Promise.all([obtenerMapaTickets(espacios), obtenerMapaReservas(espacios)])
      : [new Map(), new Map()];
    renderizarEspacios(espacios, mapaZonas, mapaTickets, mapaReservas);
    setConnectionStatus(true);
  } else {
    setConnectionStatus(false);
  }
};

const conectarSSE = () => {
  const eventSource = new EventSource(EP.sseEspacios);

  eventSource.onopen = () => {
    console.log("SSE: conexión establecida");
    setConnectionStatus(true);
  };

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      console.log("SSE recibido:", payload);
      cargarEspacios();
    } catch (e) {
      console.error("Error al parsear evento SSE:", e);
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    setConnectionStatus(false);
    eventSource.close();
    setTimeout(conectarSSE, 5000);
  };

  return eventSource;
};

// Un único listener delegado maneja las acciones renderizadas dinámicamente
// (crear/cerrar/anular ticket) -- nunca onclick inline sobre datos del backend.
function onContainerClick(event) {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;

  const { action, espacioId, ticketId, personaId, personaNombre, reservaId } = btn.dataset;
  if (action === "crear-ticket") {
    // Si viene de una tarjeta RESERVADO (ver "Confirmar llegada"), el botón
    // trae la persona que reservó para preseleccionarla y no pedirle al
    // personal que la busque de nuevo.
    const personaPreseleccionada = personaId ? { id_usuario: personaId, nombre: personaNombre } : null;
    abrirModalCrearTicket(espacioId, personaPreseleccionada);
  } else if (action === "reservar") {
    abrirModalReservar(espacioId, () => cargarEspacios());
  } else if (action === "registrar-salida") {
    registrarSalida(ticketId).then((ok) => ok && cargarEspacios());
  } else if (action === "anular-ticket") {
    abrirModalAnular(ticketId, () => cargarEspacios());
  } else if (action === "cancelar-reserva") {
    cancelarReserva(reservaId);
  } else if (action === "liberar-espacio") {
    liberarEspacio(espacioId);
  }
}

async function cancelarReserva(idReserva) {
  const ok = await confirmarAccion("¿Cancelar esta reserva? El espacio quedará disponible de inmediato.");
  if (!ok) return;
  try {
    await ReservasApi.cancelar(idReserva);
    toast("Reserva cancelada", "exito");
    cargarEspacios();
  } catch (err) {
    toast(err.message, "error");
  }
}

// Salida de emergencia para un espacio en RESERVADO sin reserva activa (ver
// comentario en renderizarTarjetaEspacio) -- fuerza el estado directamente
// con los mismos datos que ya tiene el espacio, solo cambiando a DISPONIBLE.
async function liberarEspacio(idEspacio) {
  const esp = espaciosCache.find((e) => e.idEspacio === idEspacio);
  if (!esp) return;
  const ok = await confirmarAccion("Este espacio no tiene una reserva activa registrada. ¿Liberarlo de todas formas?");
  if (!ok) return;
  try {
    await EspaciosApi.update(idEspacio, {
      idZona: esp.idZona,
      descripcion: esp.descripcion || undefined,
      tipo: esp.tipo,
      estado: "DISPONIBLE",
    });
    toast("Espacio liberado", "exito");
    cargarEspacios();
  } catch (err) {
    toast(err.message, "error");
  }
}

let inicializado = false;
export function initEspaciosTab() {
  container = document.getElementById("espaciosContainer");
  totalSpan = document.getElementById("totalEspacios");
  lastUpdateSpan = document.getElementById("lastUpdate");
  indicator = document.getElementById("indicator");
  statusText = document.getElementById("statusText");
  resumenDiv = document.getElementById("espaciosResumen");

  if (inicializado) return;
  inicializado = true;

  container.addEventListener("click", onContainerClick);

  cargarEspacios();
  conectarSSE();
  setInterval(cargarEspacios, 30000);
  setInterval(actualizarContadores, 1000);
}
