import { VehiculosApi } from "./api.js";
import { openModal, closeModal, toast, confirmarAccion, escapeHtml } from "./ui.js";

// El GET devuelve el discriminador STI ("Motocicleta"), pero el POST/PATCH
// espera el nombre que usa el DTO de creación ("Moto"). Ver el caveat sobre
// motocicleta.entity.ts en vehiculos.js más abajo: la columna "tipo" cumple
// doble rol (discriminador de tabla + subtipo de moto) y NO está garantizado
// que el subtipo real (DEPORTIVA/SCOOTER/MOTOCROSS) sobreviva en el GET.
const TIPO_A_VALOR_FORM = { Auto: "Auto", Motocicleta: "Moto", Camioneta: "Camioneta" };

let editandoId = null;

function mostrarCamposPorTipo(tipo) {
  document.getElementById("camposAuto").classList.toggle("hidden", tipo !== "Auto");
  document.getElementById("camposMoto").classList.toggle("hidden", tipo !== "Moto");
  document.getElementById("camposCamioneta").classList.toggle("hidden", tipo !== "Camioneta");
}

function filaVehiculo(v) {
  return `
    <tr class="border-b border-slate-100">
      <td class="px-3 py-2 text-sm font-semibold">${escapeHtml(v.placa)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(TIPO_A_VALOR_FORM[v.tipo] || v.tipo)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(v.color)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(v.anio)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(v.clasificacion)}</td>
      <td class="px-3 py-2 text-sm flex gap-2">
        <button data-action="editar" data-id="${v.id_vehiculo}" class="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-2.5 py-1 transition-colors">Editar</button>
        <button data-action="eliminar" data-id="${v.id_vehiculo}" class="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-1 transition-colors">Eliminar</button>
      </td>
    </tr>`;
}

let vehiculosCache = [];
async function recargarTabla() {
  vehiculosCache = (await VehiculosApi.getAll()) || [];
  const tbody = document.getElementById("vehiculosTbody");
  tbody.innerHTML =
    vehiculosCache.length === 0
      ? `<tr><td colspan="7" class="text-center py-6 text-slate-500">Sin vehículos registrados</td></tr>`
      : vehiculosCache.map(filaVehiculo).join("");
}

function resetForm() {
  editandoId = null;
  document.getElementById("formVehiculo").reset();
  document.getElementById("vehiculoError").classList.add("hidden");
  document.getElementById("vehiculoModalTitulo").textContent = "Nuevo vehículo";
  mostrarCamposPorTipo(document.getElementById("vehiculoTipo").value);
}

function abrirModalNuevo() {
  resetForm();
  openModal("modalVehiculo");
}

// Permite abrir este mismo modal desde otro flujo (el de "Registrar
// ingreso" en ticket-modal.js), sin duplicar el formulario. onCreado se
// invoca una sola vez, solo si el vehículo se creó (no en edición).
let onVehiculoCreadoExterno = null;
export function abrirModalNuevoVehiculo(onCreado) {
  onVehiculoCreadoExterno = onCreado || null;
  abrirModalNuevo();
}

function abrirModalEditar(id) {
  const v = vehiculosCache.find((x) => x.id_vehiculo === id);
  if (!v) return;
  resetForm();
  editandoId = id;
  document.getElementById("vehiculoModalTitulo").textContent = `Editar ${v.placa}`;

  const tipoForm = TIPO_A_VALOR_FORM[v.tipo] || "Auto";
  document.getElementById("vehiculoTipo").value = tipoForm;
  mostrarCamposPorTipo(tipoForm);

  document.getElementById("vehiculoPlaca").value = v.placa;
  document.getElementById("vehiculoMarca").value = v.marca;
  document.getElementById("vehiculoModelo").value = v.modelo;
  document.getElementById("vehiculoColor").value = v.color;
  document.getElementById("vehiculoAnio").value = v.anio;
  document.getElementById("vehiculoClasificacion").value = v.clasificacion;

  if (tipoForm === "Auto") {
    document.getElementById("autoNumeroPuertas").value = v.numeroPuertas ?? "";
    document.getElementById("autoCapacidadMaletero").value = v.capacidadMaletero ?? "";
    document.getElementById("autoCapacidadCarga").value = v.capacidadCarga ?? "";
  } else if (tipoForm === "Camioneta") {
    document.getElementById("camionetaCapacidadCarga").value = v.capacidadCarga ?? "";
    document.getElementById("camionetaCabina").value = v.cabina ?? "Simple";
  } else if (tipoForm === "Moto") {
    // Caveat verificado: la columna "tipo" en BD sirve a la vez de
    // discriminador STI ("Motocicleta") y de subtipo de negocio
    // (DEPORTIVA/SCOOTER/MOTOCROSS) -- no hay garantía de que el GET
    // devuelva el subtipo real en vez del discriminador. Se deja el select
    // sin preseleccionar en vez de asumir un valor que puede ser incorrecto.
    document.getElementById("motoSubtipo").value = "";
  }

  openModal("modalVehiculo");
}

function datosPorTipo(tipo) {
  if (tipo === "Auto") {
    return {
      numeroPuertas: Number(document.getElementById("autoNumeroPuertas").value),
      capacidadMaletero: Number(document.getElementById("autoCapacidadMaletero").value),
      capacidadCarga: Number(document.getElementById("autoCapacidadCarga").value),
    };
  }
  if (tipo === "Camioneta") {
    return {
      capacidadCarga: Number(document.getElementById("camionetaCapacidadCarga").value),
      cabina: document.getElementById("camionetaCabina").value,
    };
  }
  if (tipo === "Moto") {
    return { tipo: document.getElementById("motoSubtipo").value };
  }
  return {};
}

async function onSubmit(e) {
  e.preventDefault();
  const errorBox = document.getElementById("vehiculoError");
  errorBox.classList.add("hidden");

  const tipo = document.getElementById("vehiculoTipo").value;
  const dto = {
    tipo,
    datos: {
      placa: document.getElementById("vehiculoPlaca").value.trim().toUpperCase(),
      marca: document.getElementById("vehiculoMarca").value.trim(),
      modelo: document.getElementById("vehiculoModelo").value.trim(),
      color: document.getElementById("vehiculoColor").value.trim(),
      anio: Number(document.getElementById("vehiculoAnio").value),
      clasificacion: document.getElementById("vehiculoClasificacion").value,
      ...datosPorTipo(tipo),
    },
  };

  try {
    if (editandoId) {
      await VehiculosApi.update(editandoId, dto);
      toast("Vehículo actualizado", "exito");
    } else {
      const creado = await VehiculosApi.create(dto);
      toast("Vehículo creado", "exito");
      onVehiculoCreadoExterno?.(creado);
      onVehiculoCreadoExterno = null;
    }
    closeModal("modalVehiculo");
    await recargarTabla();
  } catch (err) {
    // El backend lanza un error genérico (no HttpException) si el id no
    // existe en update/remove -> llega como 500 sin mensaje útil; se
    // muestra siempre un texto genérico en vez del crudo del backend.
    errorBox.textContent = err.status >= 500 ? "Ocurrió un error al procesar el vehículo" : err.message;
    errorBox.classList.remove("hidden");
  }
}

async function onTablaClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === "editar") {
    abrirModalEditar(id);
  } else if (action === "eliminar") {
    const ok = await confirmarAccion("¿Eliminar este vehículo?");
    if (!ok) return;
    try {
      await VehiculosApi.remove(id);
      toast("Vehículo eliminado", "exito");
      await recargarTabla();
    } catch {
      toast("Ocurrió un error al procesar el vehículo", "error");
    }
  }
}

// El modal (#modalVehiculo) se conecta una sola vez al cargar el módulo,
// independientemente de si el usuario ya visitó el tab Vehículos -- así el
// flujo "+ Nuevo vehículo" desde ticket-modal.js funciona aunque el tab
// nunca se haya abierto. Solo la carga de la tabla (recargarTabla) queda
// diferida al primer click en el tab, ya que sí implica una petición real.
function wireModalVehiculo() {
  document.getElementById("btnNuevoVehiculo").addEventListener("click", abrirModalNuevo);
  document.getElementById("btnCancelarVehiculo").addEventListener("click", () => {
    onVehiculoCreadoExterno = null;
    closeModal("modalVehiculo");
  });
  document.getElementById("formVehiculo").addEventListener("submit", onSubmit);
  document.getElementById("vehiculoTipo").addEventListener("change", (e) => mostrarCamposPorTipo(e.target.value));
  document.getElementById("vehiculosTbody").addEventListener("click", onTablaClick);
}

wireModalVehiculo();

export function initVehiculosTab() {
  recargarTabla();
}
