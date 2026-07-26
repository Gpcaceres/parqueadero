// Color del badge por estado (debe cubrir los 5 valores de EstadoEspacio en
// el backend: DISPONIBLE, OCUPADO, RESERVADO, MANTENIMIENTO, INACTIVO).
export const BADGE_CLASS_POR_ESTADO = {
  DISPONIBLE: "bg-green-200 text-green-800",
  OCUPADO: "bg-red-200 text-red-800",
  RESERVADO: "bg-violet-200 text-violet-800",
  MANTENIMIENTO: "bg-amber-200 text-amber-800",
  INACTIVO: "bg-slate-200 text-slate-800",
};

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleString("es-ES", { hour12: false });
};

// Duración transcurrida en formato HH:MM:SS (o "Dd HH:MM:SS" si pasa de un
// día), recalculada cada segundo por actualizarContadores() en espacios.js.
export const formatearDuracion = (ms) => {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const base = `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
  return dias > 0 ? `${dias}d ${base}` : base;
};

// Mismas reglas y montos que back-end/ms-tickets/src/tickets/tarifas.ts: se
// replican aquí solo para mostrar en vivo, en la tarjeta, el valor que se
// cobraría SI la salida se registrara ahora mismo. El monto real y
// definitivo siempre lo calcula el backend en registrarSalida.
export const TARIFAS = { MENSUAL: 25, POR_HORA: 0.5, NOCTURNO: 3 };
const MS_POR_HORA = 60 * 60 * 1000;
const HORA_FIN_NOCTURNO = 7;

const horasPorFraccion = (ms) => Math.max(1, Math.ceil(ms / MS_POR_HORA));
const redondear = (valor) => Math.round(valor * 100) / 100;

export const calcularValorEnCurso = (tipoTarifa, fechaIngreso, ahora) => {
  switch (tipoTarifa) {
    case "MENSUAL":
      return TARIFAS.MENSUAL;

    case "POR_HORA":
      return redondear(horasPorFraccion(ahora - fechaIngreso) * TARIFAS.POR_HORA);

    case "NOCTURNO": {
      const corte = new Date(fechaIngreso);
      corte.setHours(HORA_FIN_NOCTURNO, 0, 0, 0);
      if (corte.getTime() <= fechaIngreso) corte.setDate(corte.getDate() + 1);

      let total = TARIFAS.NOCTURNO;
      if (ahora > corte.getTime()) {
        total += horasPorFraccion(ahora - corte.getTime()) * TARIFAS.POR_HORA;
      }
      return redondear(total);
    }

    default:
      return null;
  }
};

export const formatearMoneda = (valor) =>
  valor === null || valor === undefined ? "N/A" : `$${Number(valor).toFixed(2)}`;

// Todo texto que venga del backend (nombre de persona, motivo de anulación,
// placa escrita a mano, etc.) pasa por aquí antes de insertarse en
// innerHTML -- evita que un dato guardado en la BD se interprete como HTML.
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

let toastContainer = null;
export function toast(mensaje, tipo = "info") {
  if (!toastContainer) toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const estilos = {
    info: { bg: "bg-slate-800", icon: "ℹ️" },
    exito: { bg: "bg-emerald-600", icon: "✅" },
    error: { bg: "bg-red-600", icon: "⚠️" },
  };
  const { bg, icon } = estilos[tipo] || estilos.info;

  const el = document.createElement("div");
  el.className = `${bg} text-white pl-3.5 pr-4 py-3 rounded-xl shadow-lg shadow-slate-900/20 text-sm font-medium max-w-sm flex items-center gap-2 transition-opacity duration-300`;
  el.innerHTML = `<span>${icon}</span><span>${escapeHtml(mensaje)}</span>`;
  toastContainer.appendChild(el);

  setTimeout(() => {
    el.classList.add("opacity-0");
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

export function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

export function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
}

// Confirmación simple reutilizable para acciones de bajo riesgo (eliminar
// vehículo). Para "anular ticket" se usa un modal propio con campo de
// motivo, no esto.
export function confirmarAccion(mensaje) {
  return Promise.resolve(window.confirm(mensaje));
}
