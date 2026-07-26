import { ZonasApi, EspaciosApi } from "./api.js";
import { openModal, closeModal, toast, escapeHtml, BADGE_CLASS_POR_ESTADO } from "./ui.js";

// Escritura en /api/v1/zonas y /api/v1/espacios exige rol admin, recaudador
// o root (WriteAuthorizationFilter en el backend) -- el mismo set de roles
// "empleado" que ya opera tickets/vehículos, no solo admin.

let zonasCache = [];
let editandoZonaId = null;
let editandoEspacioId = null;
let zonaEspacioActivo = null; // idZona cuya lista de espacios está expandida

function badgeActivo(estado) {
  return estado === 1
    ? `<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-200 text-green-800">Activa</span>`
    : `<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-800">Inactiva</span>`;
}

function filaEspacio(esp) {
  const estado = esp.estadoEspacio;
  return `
    <tr class="border-b border-slate-100">
      <td class="px-3 py-1.5 text-sm font-semibold">${escapeHtml(esp.codigo)}</td>
      <td class="px-3 py-1.5 text-sm">${escapeHtml(esp.descripcion || "—")}</td>
      <td class="px-3 py-1.5 text-sm">${escapeHtml(esp.tipo)}</td>
      <td class="px-3 py-1.5 text-sm">
        <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${BADGE_CLASS_POR_ESTADO[estado] || ""}">${escapeHtml(estado)}</span>
      </td>
      <td class="px-3 py-1.5 text-sm flex gap-2">
        <button data-action="editar-espacio" data-id="${esp.idEspacio}" class="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-2.5 py-1 transition-colors">Editar</button>
        <button data-action="toggle-espacio" data-id="${esp.idEspacio}" class="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2.5 py-1 transition-colors">
          ${estado === "INACTIVO" ? "Activar" : "Desactivar"}
        </button>
      </td>
    </tr>`;
}

async function renderEspaciosDeZona(idZona) {
  const cont = document.querySelector(`.espacios-de-zona[data-zona-id="${idZona}"]`);
  if (!cont) return;
  cont.innerHTML = `<p class="text-sm text-slate-400">Cargando espacios…</p>`;
  const espacios = (await EspaciosApi.getByZona(idZona)) || [];
  cont.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-semibold text-slate-700">Espacios de la zona</span>
      <button data-action="nuevo-espacio" data-zona-id="${idZona}" class="text-xs font-semibold text-brand-600 hover:text-brand-800">+ Nuevo espacio</button>
    </div>
    <table class="w-full text-left table-modern">
      <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold">
        <tr>
          <th class="px-3 py-1.5">Código</th>
          <th class="px-3 py-1.5">Descripción</th>
          <th class="px-3 py-1.5">Tipo</th>
          <th class="px-3 py-1.5">Estado</th>
          <th class="px-3 py-1.5">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${espacios.length === 0 ? `<tr><td colspan="5" class="text-center py-4 text-slate-500">Sin espacios en esta zona</td></tr>` : espacios.map(filaEspacio).join("")}
      </tbody>
    </table>`;
}

function filaZona(z) {
  return `
    <div class="card-surface p-5">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div class="font-bold text-slate-800">${escapeHtml(z.nombre)} <span class="text-xs text-slate-400">(${escapeHtml(z.codigo)})</span></div>
          <div class="text-sm text-slate-600">Tipo: ${escapeHtml(z.tipo)} · Capacidad: ${escapeHtml(z.capacidad ?? "—")} · Espacios: ${escapeHtml(z.totalEspacios)}</div>
        </div>
        <div class="flex items-center gap-2">
          ${badgeActivo(z.estado)}
          <button data-action="editar-zona" data-id="${z.idZona}" class="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-2.5 py-1 transition-colors">Editar</button>
          <button data-action="toggle-zona" data-id="${z.idZona}" class="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2.5 py-1 transition-colors">
            ${z.estado === 1 ? "Desactivar" : "Activar"}
          </button>
          <button data-action="ver-espacios" data-id="${z.idZona}" class="text-xs font-semibold bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1 transition-colors">Ver espacios</button>
        </div>
      </div>
      <div class="espacios-de-zona hidden mt-3 border-t pt-3" data-zona-id="${z.idZona}"></div>
    </div>`;
}

async function recargarZonas() {
  zonasCache = (await ZonasApi.getAll()) || [];
  const cont = document.getElementById("zonasContainer");
  cont.innerHTML =
    zonasCache.length === 0
      ? `<p class="text-center py-6 text-slate-500">Sin zonas registradas</p>`
      : zonasCache.map(filaZona).join("");
}

// ---------- Modal: zona ----------

function resetFormZona() {
  editandoZonaId = null;
  document.getElementById("formZona").reset();
  document.getElementById("zonaError").classList.add("hidden");
  document.getElementById("zonaModalTitulo").textContent = "Nueva zona";
}

function abrirModalNuevaZona() {
  resetFormZona();
  openModal("modalZona");
}

function abrirModalEditarZona(id) {
  const z = zonasCache.find((x) => x.idZona === id);
  if (!z) return;
  resetFormZona();
  editandoZonaId = id;
  document.getElementById("zonaModalTitulo").textContent = `Editar ${z.nombre}`;
  document.getElementById("zonaNombre").value = z.nombre;
  document.getElementById("zonaDescripcion").value = z.descripcion || "";
  document.getElementById("zonaTipo").value = z.tipo;
  document.getElementById("zonaCapacidad").value = z.capacidad ?? "";
  openModal("modalZona");
}

async function onSubmitZona(e) {
  e.preventDefault();
  const errorBox = document.getElementById("zonaError");
  errorBox.classList.add("hidden");

  const dto = {
    nombre: document.getElementById("zonaNombre").value.trim(),
    descripcion: document.getElementById("zonaDescripcion").value.trim() || undefined,
    tipoZona: document.getElementById("zonaTipo").value,
    capacidad: document.getElementById("zonaCapacidad").value
      ? Number(document.getElementById("zonaCapacidad").value)
      : undefined,
  };

  try {
    if (editandoZonaId) {
      await ZonasApi.update(editandoZonaId, dto);
      toast("Zona actualizada", "exito");
    } else {
      await ZonasApi.create(dto);
      toast("Zona creada", "exito");
    }
    closeModal("modalZona");
    await recargarZonas();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

// ---------- Modal: espacio ----------

function resetFormEspacio() {
  editandoEspacioId = null;
  document.getElementById("formEspacio").reset();
  document.getElementById("espacioError").classList.add("hidden");
  document.getElementById("espacioModalTitulo").textContent = "Nuevo espacio";
}

function abrirModalNuevoEspacio(idZona) {
  resetFormEspacio();
  document.getElementById("espacioZonaId").value = idZona;
  document.getElementById("espacioEstado").value = "DISPONIBLE";
  openModal("modalEspacio");
}

async function abrirModalEditarEspacio(idEspacio) {
  const cont = document.querySelector(
    `.espacios-de-zona[data-zona-id="${zonaEspacioActivo}"]`,
  );
  if (!cont) return;
  // Los espacios no se cachean aparte (se piden por zona al expandir); se
  // vuelven a pedir aquí para tener el dato completo y actual del espacio.
  const espacios = (await EspaciosApi.getByZona(zonaEspacioActivo)) || [];
  const esp = espacios.find((e) => e.idEspacio === idEspacio);
  if (!esp) return;

  resetFormEspacio();
  editandoEspacioId = idEspacio;
  document.getElementById("espacioModalTitulo").textContent = `Editar ${esp.codigo}`;
  document.getElementById("espacioZonaId").value = esp.idZona;
  document.getElementById("espacioDescripcion").value = esp.descripcion || "";
  document.getElementById("espacioTipo").value = esp.tipo;
  document.getElementById("espacioEstado").value = esp.estadoEspacio;
  openModal("modalEspacio");
}

async function onSubmitEspacio(e) {
  e.preventDefault();
  const errorBox = document.getElementById("espacioError");
  errorBox.classList.add("hidden");

  const idZona = document.getElementById("espacioZonaId").value;
  const dto = {
    idZona,
    descripcion: document.getElementById("espacioDescripcion").value.trim() || undefined,
    tipo: document.getElementById("espacioTipo").value,
    estado: document.getElementById("espacioEstado").value,
  };

  try {
    if (editandoEspacioId) {
      await EspaciosApi.update(editandoEspacioId, dto);
      toast("Espacio actualizado", "exito");
    } else {
      await EspaciosApi.create(dto);
      toast("Espacio creado", "exito");
    }
    closeModal("modalEspacio");
    await renderEspaciosDeZona(idZona);
    await recargarZonas(); // el total de espacios por zona pudo cambiar
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

// ---------- Delegación de eventos ----------

async function onZonasContainerClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id, zonaId } = btn.dataset;

  if (action === "editar-zona") {
    abrirModalEditarZona(id);
  } else if (action === "toggle-zona") {
    try {
      await ZonasApi.toggleActivo(id);
      toast("Estado de la zona actualizado", "exito");
      await recargarZonas();
    } catch (err) {
      toast(err.message, "error");
    }
  } else if (action === "ver-espacios") {
    const cont = document.querySelector(`.espacios-de-zona[data-zona-id="${id}"]`);
    const abierto = !cont.classList.contains("hidden");
    if (abierto) {
      cont.classList.add("hidden");
      zonaEspacioActivo = null;
    } else {
      cont.classList.remove("hidden");
      zonaEspacioActivo = id;
      await renderEspaciosDeZona(id);
    }
  } else if (action === "nuevo-espacio") {
    abrirModalNuevoEspacio(zonaId);
  } else if (action === "editar-espacio") {
    await abrirModalEditarEspacio(id);
  } else if (action === "toggle-espacio") {
    try {
      await EspaciosApi.toggleActivo(id);
      toast("Estado del espacio actualizado", "exito");
      if (zonaEspacioActivo) await renderEspaciosDeZona(zonaEspacioActivo);
    } catch (err) {
      toast(err.message, "error");
    }
  }
}

function wireZonas() {
  document.getElementById("btnNuevaZona").addEventListener("click", abrirModalNuevaZona);
  document.getElementById("btnCancelarZona").addEventListener("click", () => closeModal("modalZona"));
  document.getElementById("formZona").addEventListener("submit", onSubmitZona);

  document.getElementById("btnCancelarEspacio").addEventListener("click", () => closeModal("modalEspacio"));
  document.getElementById("formEspacio").addEventListener("submit", onSubmitEspacio);

  document.getElementById("zonasContainer").addEventListener("click", onZonasContainerClick);
}

wireZonas();

export function initZonasTab() {
  recargarZonas();
}
