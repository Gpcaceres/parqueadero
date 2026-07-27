import { PersonasApi, UsersApi, RolesApi, UserRoleApi } from "./api.js";
import { openModal, closeModal, toast, confirmarAccion, escapeHtml } from "./ui.js";
import { hasAnyRole } from "./session.js";

// Crear/editar/eliminar personas, crear cuentas de login y asignar roles
// exige rol admin o root (ver personas.controller.ts, users.controller.ts,
// user-role.controller.ts). Asignar el rol "admin" o "root" a alguien exige
// específicamente rol root (UserRoleService.assertCanManageRole) -- admin
// puede asignar cualquier OTRO rol, pero no esos dos.
const ROLES_RESTRINGIDOS = ["admin", "root"];

let personasCache = [];
let usersCache = [];
let rolesCache = [];
let rolesPorUsuario = new Map(); // id_user -> [{id_role, name, active}]

function usuarioDe(idPersona) {
  return usersCache.find((u) => u.id_user === idPersona);
}

function nombreCompleto(p) {
  return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
}

async function cargarRolesDe(idPersona) {
  const asignaciones = (await UserRoleApi.getByUser(idPersona)) || [];
  const conNombre = asignaciones
    .filter((a) => a.active)
    .map((a) => ({ ...a, nombre: rolesCache.find((r) => r.id_role === a.id_role)?.name || "?" }));
  rolesPorUsuario.set(idPersona, conNombre);
  return conNombre;
}

function badgesRoles(idPersona) {
  const roles = rolesPorUsuario.get(idPersona) || [];
  if (roles.length === 0) return `<span class="text-xs text-slate-400">Sin roles</span>`;
  return roles
    .map(
      (r) =>
        `<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-100 text-brand-800 mr-1">${escapeHtml(r.nombre)}</span>`,
    )
    .join("");
}

function filaPersona(p) {
  const user = usuarioDe(p.id_persona);
  const accionCuenta = user
    ? `<button data-action="toggle-user" data-id="${p.id_persona}" class="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2.5 py-1 transition-colors">
         ${user.active ? "Desactivar login" : "Activar login"}
       </button>`
    : `<button data-action="crear-login" data-id="${p.id_persona}" class="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg px-2.5 py-1 transition-colors">Crear login</button>`;

  return `
    <tr class="border-b border-slate-100" data-persona-row="${p.id_persona}">
      <td class="px-3 py-2 text-sm font-semibold">${escapeHtml(nombreCompleto(p))}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(p.dni)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(p.email)}</td>
      <td class="px-3 py-2 text-sm">${user ? escapeHtml(user.username) : "<span class='text-slate-400'>Sin cuenta</span>"}</td>
      <td class="px-3 py-2 text-sm roles-cell">${badgesRoles(p.id_persona)}</td>
      <td class="px-3 py-2 text-sm flex flex-wrap gap-1">
        <button data-action="editar-persona" data-id="${p.id_persona}" class="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-2.5 py-1 transition-colors">Editar</button>
        <button data-action="eliminar-persona" data-id="${p.id_persona}" class="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-1 transition-colors">Eliminar</button>
        ${accionCuenta}
        <button data-action="roles-persona" data-id="${p.id_persona}" class="text-xs font-semibold bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-2.5 py-1 transition-colors">Roles</button>
      </td>
    </tr>`;
}

function renderTabla(lista) {
  const tbody = document.getElementById("usuariosTbody");
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500">${
      personasCache.length === 0 ? "Sin personas registradas" : "Sin resultados para esa cédula"
    }</td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(filaPersona).join("");
}

// Filtro por cédula (contiene) sobre lo ya cargado en memoria -- no hace
// falta volver a pedirle nada al backend.
function aplicarFiltroCedula() {
  const termino = document.getElementById("buscarPersonaCedula").value.trim();
  const filtradas = termino
    ? personasCache.filter((p) => (p.dni || "").includes(termino))
    : personasCache;
  renderTabla(filtradas);
}

async function recargarTabla() {
  const tbody = document.getElementById("usuariosTbody");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500">Cargando…</td></tr>`;

  const [personas, users, roles] = await Promise.all([
    PersonasApi.getAll(),
    UsersApi.getAll(),
    RolesApi.getAll(),
  ]);
  personasCache = personas || [];
  usersCache = users || [];
  rolesCache = roles || [];

  await Promise.all(personasCache.map((p) => cargarRolesDe(p.id_persona)));

  aplicarFiltroCedula();
}

// ---------- Modal: nueva/editar persona ----------

let editandoPersonaId = null;

function resetFormPersona() {
  editandoPersonaId = null;
  document.getElementById("formPersona").reset();
  document.getElementById("personaError").classList.add("hidden");
  document.getElementById("personaModalTitulo").textContent = "Nueva persona";
}

function abrirModalNuevaPersona() {
  resetFormPersona();
  openModal("modalPersona");
}

function abrirModalEditarPersona(id) {
  const p = personasCache.find((x) => x.id_persona === id);
  if (!p) return;
  resetFormPersona();
  editandoPersonaId = id;
  document.getElementById("personaModalTitulo").textContent = `Editar ${nombreCompleto(p)}`;
  document.getElementById("pFirstName").value = p.first_name;
  document.getElementById("pLastName").value = p.last_name;
  document.getElementById("pMiddleName").value = p.middle_name || "";
  document.getElementById("pDni").value = p.dni;
  document.getElementById("pEmail").value = p.email;
  document.getElementById("pPhone").value = p.phone || "";
  document.getElementById("pAddress").value = p.address || "";
  openModal("modalPersona");
}

async function onSubmitPersona(e) {
  e.preventDefault();
  const errorBox = document.getElementById("personaError");
  errorBox.classList.add("hidden");

  const dto = {
    first_name: document.getElementById("pFirstName").value.trim(),
    last_name: document.getElementById("pLastName").value.trim(),
    dni: document.getElementById("pDni").value.trim(),
    email: document.getElementById("pEmail").value.trim(),
  };
  const middleName = document.getElementById("pMiddleName").value.trim();
  const phone = document.getElementById("pPhone").value.trim();
  const address = document.getElementById("pAddress").value.trim();
  if (middleName) dto.middle_name = middleName;
  if (phone) dto.phone = phone;
  if (address) dto.address = address;

  try {
    if (editandoPersonaId) {
      await PersonasApi.update(editandoPersonaId, dto);
      toast("Persona actualizada", "exito");
    } else {
      await PersonasApi.create(dto);
      toast("Persona creada", "exito");
    }
    closeModal("modalPersona");
    await recargarTabla();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

// ---------- Modal: crear login ----------

let personaParaLogin = null;

function abrirModalCrearLogin(idPersona) {
  personaParaLogin = idPersona;
  document.getElementById("formLogin2").reset();
  document.getElementById("login2Error").classList.add("hidden");
  openModal("modalCrearLogin");
}

async function onSubmitCrearLogin(e) {
  e.preventDefault();
  const errorBox = document.getElementById("login2Error");
  errorBox.classList.add("hidden");
  const password = document.getElementById("login2Password").value;

  try {
    const user = await UsersApi.create({ id_user: personaParaLogin, password });
    toast(`Cuenta creada: usuario "${user.username}"`, "exito");
    closeModal("modalCrearLogin");
    await recargarTabla();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

// ---------- Modal: gestionar roles ----------

let personaParaRoles = null;

function opcionesRolesDisponibles(idPersona) {
  const asignados = new Set((rolesPorUsuario.get(idPersona) || []).map((r) => r.id_role));
  const puedeAsignarRestringidos = hasAnyRole("root");
  return rolesCache.filter(
    (r) =>
      !asignados.has(r.id_role) &&
      (puedeAsignarRestringidos || !ROLES_RESTRINGIDOS.includes((r.name || "").toLowerCase())),
  );
}

async function renderModalRoles() {
  const roles = rolesPorUsuario.get(personaParaRoles) || [];
  const listaActual = document.getElementById("rolesActuales");
  listaActual.innerHTML =
    roles.length === 0
      ? `<span class="text-sm text-slate-400">Sin roles asignados</span>`
      : roles
          .map(
            (r) => `
        <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-brand-100 text-brand-800 mr-1 mb-1">
          ${escapeHtml(r.nombre)}
          <button data-action="quitar-rol" data-id-role="${r.id_role}" class="text-brand-800 hover:text-red-700 font-bold">×</button>
        </span>`,
          )
          .join("");

  const select = document.getElementById("rolNuevoSelect");
  const disponibles = opcionesRolesDisponibles(personaParaRoles);
  select.innerHTML = disponibles.length
    ? disponibles.map((r) => `<option value="${r.id_role}">${escapeHtml(r.name)}</option>`).join("")
    : `<option value="">(sin roles disponibles para asignar)</option>`;
  document.getElementById("btnAgregarRol").disabled = disponibles.length === 0;
}

async function abrirModalRoles(idPersona) {
  personaParaRoles = idPersona;
  const p = personasCache.find((x) => x.id_persona === idPersona);
  document.getElementById("rolesModalTitulo").textContent = `Roles de ${nombreCompleto(p)}`;
  document.getElementById("rolesError").classList.add("hidden");
  await renderModalRoles();
  openModal("modalRoles");
}

async function onRolesModalClick(e) {
  const btn = e.target.closest("[data-action='quitar-rol']");
  if (!btn) return;
  const errorBox = document.getElementById("rolesError");
  try {
    await UserRoleApi.remove(personaParaRoles, btn.dataset.idRole);
    await cargarRolesDe(personaParaRoles);
    await renderModalRoles();
    actualizarCeldaRoles(personaParaRoles);
    toast("Rol retirado", "exito");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

async function onAgregarRol() {
  const idRole = document.getElementById("rolNuevoSelect").value;
  if (!idRole) return;
  const errorBox = document.getElementById("rolesError");
  try {
    await UserRoleApi.assign(personaParaRoles, idRole);
    await cargarRolesDe(personaParaRoles);
    await renderModalRoles();
    actualizarCeldaRoles(personaParaRoles);
    toast("Rol asignado", "exito");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

function actualizarCeldaRoles(idPersona) {
  const fila = document.querySelector(`tr[data-persona-row="${idPersona}"] .roles-cell`);
  if (fila) fila.innerHTML = badgesRoles(idPersona);
}

// ---------- Delegación de eventos de la tabla ----------

async function onTablaClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === "editar-persona") {
    abrirModalEditarPersona(id);
  } else if (action === "eliminar-persona") {
    const ok = await confirmarAccion("¿Eliminar esta persona? Esto también elimina su cuenta de login si tiene una.");
    if (!ok) return;
    try {
      await PersonasApi.remove(id);
      toast("Persona eliminada", "exito");
      await recargarTabla();
    } catch (err) {
      toast(err.message, "error");
    }
  } else if (action === "crear-login") {
    abrirModalCrearLogin(id);
  } else if (action === "toggle-user") {
    const user = usuarioDe(id);
    try {
      await UsersApi.setActive(id, !user.active);
      toast(user.active ? "Login desactivado" : "Login activado", "exito");
      await recargarTabla();
    } catch (err) {
      toast(err.message, "error");
    }
  } else if (action === "roles-persona") {
    await abrirModalRoles(id);
  }
}

function wireUsuarios() {
  document.getElementById("btnNuevaPersonaAdmin").addEventListener("click", abrirModalNuevaPersona);
  document.getElementById("btnCancelarPersona").addEventListener("click", () => closeModal("modalPersona"));
  document.getElementById("formPersona").addEventListener("submit", onSubmitPersona);

  document.getElementById("btnCancelarLogin2").addEventListener("click", () => closeModal("modalCrearLogin"));
  document.getElementById("formLogin2").addEventListener("submit", onSubmitCrearLogin);

  document.getElementById("btnCerrarRoles").addEventListener("click", () => closeModal("modalRoles"));
  document.getElementById("btnAgregarRol").addEventListener("click", onAgregarRol);
  document.getElementById("rolesActuales").addEventListener("click", onRolesModalClick);

  document.getElementById("usuariosTbody").addEventListener("click", onTablaClick);
  document.getElementById("buscarPersonaCedula").addEventListener("input", aplicarFiltroCedula);
}

wireUsuarios();

export function initUsuariosTab() {
  recargarTabla();
}
