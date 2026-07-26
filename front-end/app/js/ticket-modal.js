import { PersonasApi, VehiculosApi, TicketsApi } from "./api.js";
import { openModal, closeModal, toast, escapeHtml, TARIFAS, formatearMoneda } from "./ui.js";
import { hasAnyRole } from "./session.js";
import { abrirModalNuevoVehiculo } from "./vehiculos.js";

// El GET devuelve el discriminador STI ("Motocicleta"), no lo que se manda
// al crear ("Moto") -- se usa solo para sugerir el tipo_vehiculo al elegir
// una placa ya registrada, nunca se manda tal cual de vuelta al backend.
const TIPO_VEHICULO_DISPLAY = { Auto: "Auto", Motocicleta: "Moto", Camioneta: "Camioneta" };

let personasCache = null;
let vehiculosCache = null;

async function cargarPersonas() {
  if (!personasCache) personasCache = (await PersonasApi.getAll()) || [];
  return personasCache;
}

async function cargarVehiculos() {
  if (!vehiculosCache) vehiculosCache = (await VehiculosApi.getAll()) || [];
  return vehiculosCache;
}

function nombreCompleto(persona) {
  return [persona.first_name, persona.middle_name, persona.last_name].filter(Boolean).join(" ");
}

// ---------- Modal: crear ticket (registrar ingreso) ----------

let personaSeleccionada = null;

function renderResultadosPersona(query) {
  const resultados = document.getElementById("ticketPersonaResultados");
  const q = query.trim().toLowerCase();
  if (!q) {
    resultados.innerHTML = "";
    resultados.classList.add("hidden");
    return;
  }

  const coincidencias = (personasCache || [])
    .filter(
      (p) =>
        nombreCompleto(p).toLowerCase().includes(q) || (p.dni || "").toLowerCase().includes(q),
    )
    .slice(0, 8);

  if (coincidencias.length === 0) {
    resultados.innerHTML = `<div class="px-3 py-2 text-sm text-slate-500">Sin coincidencias</div>`;
  } else {
    resultados.innerHTML = coincidencias
      .map(
        (p) => `
          <div class="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer" data-persona-id="${p.id_persona}">
            ${escapeHtml(nombreCompleto(p))} <span class="text-slate-400">· ${escapeHtml(p.dni)}</span>
          </div>`,
      )
      .join("");
  }
  resultados.classList.remove("hidden");
}

function seleccionarPersona(idPersona) {
  const persona = (personasCache || []).find((p) => p.id_persona === idPersona);
  if (!persona) return;
  personaSeleccionada = persona;
  document.getElementById("ticketPersonaBusqueda").value = `${nombreCompleto(persona)} (${persona.dni})`;
  document.getElementById("ticketPersonaResultados").classList.add("hidden");
}

function sugerirTipoPorPlaca(placa) {
  const vehiculo = (vehiculosCache || []).find(
    (v) => (v.placa || "").toUpperCase() === placa.toUpperCase(),
  );
  if (vehiculo) {
    const select = document.getElementById("ticketTipoVehiculo");
    select.value = TIPO_VEHICULO_DISPLAY[vehiculo.tipo] || select.value;
  }
}

function mostrarBloqueBusquedaPersona() {
  document.getElementById("bloqueBuscarPersona").classList.remove("hidden");
  document.getElementById("bloqueNuevaPersona").classList.add("hidden");
}

function mostrarBloqueNuevaPersona() {
  document.getElementById("bloqueBuscarPersona").classList.add("hidden");
  document.getElementById("bloqueNuevaPersona").classList.remove("hidden");
}

function resetFormCrearTicket() {
  personaSeleccionada = null;
  document.getElementById("formCrearTicket").reset();
  document.getElementById("ticketPersonaResultados").classList.add("hidden");
  document.getElementById("ticketCrearError").classList.add("hidden");
  document.getElementById("nuevaPersonaError").classList.add("hidden");
  mostrarBloqueBusquedaPersona();

  // POST /personas exige rol admin o root (ver personas.controller.ts) --
  // recaudador puede crear/cerrar tickets, pero no registrar personas nuevas.
  document
    .getElementById("btnMostrarNuevaPersona")
    .classList.toggle("hidden", !hasAnyRole("admin", "root"));
}

function poblarTextoTarifas() {
  document.querySelectorAll("#ticketTipoTarifa option").forEach((opt) => {
    const precio = TARIFAS[opt.value];
    if (precio === undefined) return;
    const base = opt.textContent.split(" — ")[0];
    const detalle =
      opt.value === "NOCTURNO"
        ? `$${precio} fijo + excedente por hora fuera de la ventana`
        : opt.value === "MENSUAL"
          ? `$${precio} fijo`
          : `$${precio.toFixed(2)}/hora o fracción`;
    opt.textContent = `${base} — ${detalle}`;
  });
}

export async function abrirModalCrearTicket(idEspacio, personaPreseleccionada) {
  resetFormCrearTicket();
  document.getElementById("ticketEspacioId").value = idEspacio;
  poblarTextoTarifas();

  const [, vehiculos] = await Promise.all([cargarPersonas(), cargarVehiculos()]);
  const datalist = document.getElementById("vehiculosDatalist");
  datalist.innerHTML = vehiculos.map((v) => `<option value="${escapeHtml(v.placa)}">`).join("");

  // Viene de "Confirmar llegada" sobre una tarjeta RESERVADO: se preselecciona
  // a quien reservó para no obligar al personal a buscarla de nuevo (sigue
  // pudiendo cambiarla a mano si hiciera falta).
  if (personaPreseleccionada?.id_usuario) {
    personaSeleccionada = { id_persona: personaPreseleccionada.id_usuario };
    document.getElementById("ticketPersonaBusqueda").value =
      personaPreseleccionada.nombre || "Cliente que reservó (contacto no disponible)";
  }

  openModal("modalCrearTicket");
}

function wireModalCrearTicket() {
  document.getElementById("ticketPersonaBusqueda").addEventListener("input", (e) => {
    personaSeleccionada = null;
    renderResultadosPersona(e.target.value);
  });

  document.getElementById("ticketPersonaResultados").addEventListener("click", (e) => {
    const fila = e.target.closest("[data-persona-id]");
    if (fila) seleccionarPersona(fila.dataset.personaId);
  });

  document.getElementById("ticketVehiculoPlaca").addEventListener("change", (e) => {
    if (e.target.value) sugerirTipoPorPlaca(e.target.value);
  });

  document.getElementById("btnMostrarNuevoVehiculo").addEventListener("click", () => {
    abrirModalNuevoVehiculo((vehiculo) => {
      vehiculosCache = [...(vehiculosCache || []), vehiculo];
      document.getElementById("vehiculosDatalist").innerHTML = vehiculosCache
        .map((v) => `<option value="${escapeHtml(v.placa)}">`)
        .join("");
      document.getElementById("ticketVehiculoPlaca").value = vehiculo.placa;
      document.getElementById("ticketTipoVehiculo").value =
        TIPO_VEHICULO_DISPLAY[vehiculo.tipo] || "Auto";
      // #modalCrearTicket nunca se cerró -- #modalVehiculo se abrió encima y
      // se cierra solo al guardar, dejando este formulario visible de nuevo.
    });
  });

  document.getElementById("btnCancelarCrearTicket").addEventListener("click", () => {
    closeModal("modalCrearTicket");
  });

  document.getElementById("btnMostrarNuevaPersona").addEventListener("click", () => {
    document.getElementById("nuevaPersonaError").classList.add("hidden");
    mostrarBloqueNuevaPersona();
  });

  document.getElementById("btnCancelarNuevaPersona").addEventListener("click", () => {
    mostrarBloqueBusquedaPersona();
  });

  document.getElementById("btnGuardarNuevaPersona").addEventListener("click", async () => {
    const errorBox = document.getElementById("nuevaPersonaError");
    errorBox.classList.add("hidden");

    const dto = {
      first_name: document.getElementById("npFirstName").value.trim(),
      last_name: document.getElementById("npLastName").value.trim(),
      dni: document.getElementById("npDni").value.trim(),
      email: document.getElementById("npEmail").value.trim(),
    };
    const phone = document.getElementById("npPhone").value.trim();
    if (phone) dto.phone = phone;

    if (!dto.first_name || !dto.last_name || !dto.dni || !dto.email) {
      errorBox.textContent = "Nombre, apellido, cédula y email son obligatorios.";
      errorBox.classList.remove("hidden");
      return;
    }

    try {
      const persona = await PersonasApi.create(dto);
      personasCache = [...(personasCache || []), persona];
      seleccionarPersona(persona.id_persona);
      mostrarBloqueBusquedaPersona();
      toast("Persona registrada correctamente", "exito");
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    }
  });

  document.getElementById("formCrearTicket").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("ticketCrearError");
    errorBox.classList.add("hidden");

    if (!personaSeleccionada) {
      errorBox.textContent = "Selecciona una persona de la lista de resultados.";
      errorBox.classList.remove("hidden");
      return;
    }

    const dto = {
      id_espacio: document.getElementById("ticketEspacioId").value,
      id_usuario: personaSeleccionada.id_persona,
      id_vehiculo: document.getElementById("ticketVehiculoPlaca").value.trim(),
      tipo_vehiculo: document.getElementById("ticketTipoVehiculo").value,
      tipo_tarifa: document.getElementById("ticketTipoTarifa").value,
    };

    try {
      await TicketsApi.create(dto);
      closeModal("modalCrearTicket");
      toast("Ticket creado correctamente", "exito");
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    }
  });
}

// ---------- Registrar salida (sin modal, acción directa) ----------

export async function registrarSalida(idTicket) {
  try {
    const ticket = await TicketsApi.registrarSalida(idTicket);
    toast(`Salida registrada. Cobro: ${formatearMoneda(ticket.valor_recaudado)}`, "exito");
    return true;
  } catch (err) {
    toast(err.message, "error");
    return false;
  }
}

// ---------- Modal: anular ticket ----------

let ticketAAnular = null;
let onAnularSuccess = null;

export function abrirModalAnular(idTicket, onSuccess) {
  ticketAAnular = idTicket;
  onAnularSuccess = onSuccess;
  document.getElementById("formAnularTicket").reset();
  document.getElementById("ticketAnularError").classList.add("hidden");
  openModal("modalAnularTicket");
}

function wireModalAnular() {
  document.getElementById("btnCancelarAnular").addEventListener("click", () => {
    closeModal("modalAnularTicket");
  });

  document.getElementById("formAnularTicket").addEventListener("submit", async (e) => {
    e.preventDefault();
    const motivo = document.getElementById("anularMotivo").value.trim() || undefined;
    const errorBox = document.getElementById("ticketAnularError");
    try {
      await TicketsApi.anular(ticketAAnular, motivo);
      closeModal("modalAnularTicket");
      toast("Ticket anulado", "exito");
      onAnularSuccess?.();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    }
  });
}

wireModalCrearTicket();
wireModalAnular();
