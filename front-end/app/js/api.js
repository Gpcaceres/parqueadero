import { EP } from "./config.js";
import { getToken, clearSession } from "./session.js";

// Para lecturas del dashboard donde un fallo transitorio no debe interrumpir
// ni mostrar errores al usuario -- igual que el fetchJson original.
export const fetchJsonSilent = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    // Igual que en apiFetch: un 200 puede venir con cuerpo vacío (ej.
    // GET /tickets|reservas/espacio/:id cuando no hay ninguno activo, el
    // controller devuelve null y Nest no manda ni siquiera el literal
    // "null") -- response.json() sobre eso lanza "Unexpected end of JSON
    // input" en vez de simplemente resolver a null.
    const texto = await response.text();
    return texto ? JSON.parse(texto) : null;
  } catch (error) {
    console.error(`Error al obtener ${url}:`, error);
    return null;
  }
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Para toda acción disparada por el usuario (login, crear/cerrar/anular
// ticket, CRUD de vehículos). Agrega el token si hay sesión, y centraliza
// el manejo de 401 (sesión inválida/expirada) y 403 (rol sin permiso).
export async function apiFetch(url, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor", 0);
  }

  if (response.status === 401) {
    clearSession();
    window.location.href = "login.html?expired=1";
    throw new ApiError("Sesión expirada", 401);
  }

  if (response.status === 403) {
    throw new ApiError("No tienes permiso para realizar esta acción", 403);
  }

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) {
        mensaje = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      }
    } catch {
      // el body no era JSON o venía vacío; se deja el mensaje genérico
    }
    throw new ApiError(mensaje, response.status);
  }

  // Algunos endpoints devuelven 200 con cuerpo vacío (ej. DELETE
  // /user-role/:id_user/:id_role, que responde void) en vez de 204 -- si se
  // asume que todo 200 trae JSON, response.json() lanza "Unexpected end of
  // JSON input" sobre un body vacío. Eso hacía que "quitar rol" pareciera
  // fallar en el modal de roles aunque el backend sí lo hubiera borrado.
  const texto = await response.text();
  return texto ? JSON.parse(texto) : null;
}

export const AuthApi = {
  login: (username, password) =>
    apiFetch(EP.authLogin, { method: "POST", body: { username, password } }),
};

export const PersonasApi = {
  getAll: () => apiFetch(EP.personas),
  create: (dto) => apiFetch(EP.personas, { method: "POST", body: dto }),
  update: (id, dto) => apiFetch(`${EP.personas}/${id}`, { method: "PATCH", body: dto }),
  remove: (id) => apiFetch(`${EP.personas}/${id}`, { method: "DELETE" }),
};

export const UsersApi = {
  getAll: () => apiFetch(EP.users),
  create: (dto) => apiFetch(EP.users, { method: "POST", body: dto }),
  setActive: (id, active) => apiFetch(`${EP.users}/${id}`, { method: "PATCH", body: { active } }),
};

export const RolesApi = {
  getAll: () => apiFetch(EP.roles),
};

export const UserRoleApi = {
  getByUser: (idUser) => apiFetch(`${EP.userRole}/${idUser}`),
  assign: (idUser, idRole) =>
    apiFetch(EP.userRole, { method: "POST", body: { id_user: idUser, id_role: idRole } }),
  setActive: (idUser, idRole, active) =>
    apiFetch(`${EP.userRole}/${idUser}/${idRole}`, { method: "PATCH", body: { active } }),
  remove: (idUser, idRole) =>
    apiFetch(`${EP.userRole}/${idUser}/${idRole}`, { method: "DELETE" }),
};

export const AuditApi = {
  getAll: () => apiFetch(EP.audit),
};

export const ReservasApi = {
  create: (dto) => apiFetch(EP.reservas, { method: "POST", body: dto }),
  cancelar: (id) => apiFetch(`${EP.reservas}/${id}/cancelar`, { method: "PATCH" }),
};

export const VehiculosApi = {
  getAll: () => apiFetch(EP.vehiculos),
  create: (dto) => apiFetch(EP.vehiculos, { method: "POST", body: dto }),
  update: (id, dto) => apiFetch(`${EP.vehiculos}/${id}`, { method: "PATCH", body: dto }),
  remove: (id) => apiFetch(`${EP.vehiculos}/${id}`, { method: "DELETE" }),
};

// "desde"/"hasta" son opcionales (YYYY-MM-DD) -- filtran por fecha de
// ingreso, ver TicketsService.findAll en ms-tickets.
const queryFechas = (desde, hasta) => {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const TicketsApi = {
  getAll: (desde, hasta) => apiFetch(`${EP.tickets}${queryFechas(desde, hasta)}`),
  getEstadisticas: () => apiFetch(EP.ticketsEstadisticas),
  getBySpace: (idEspacio) => apiFetch(`${EP.tickets}/espacio/${idEspacio}`),
  getByUser: (idUsuario) => apiFetch(`${EP.tickets}/usuario/${idUsuario}`),
  create: (dto) => apiFetch(EP.tickets, { method: "POST", body: dto }),
  registrarSalida: (id) => apiFetch(`${EP.tickets}/${id}/salida`, { method: "PATCH" }),
  anular: (id, motivo) =>
    apiFetch(`${EP.tickets}/${id}/anular`, { method: "PATCH", body: { motivo } }),
  urlReporte: (desde, hasta) => `${EP.tickets}/reporte${queryFechas(desde, hasta)}`,
};

export const ZonasApi = {
  getAll: () => apiFetch(EP.zonas),
  create: (dto) => apiFetch(EP.zonas, { method: "POST", body: dto }),
  update: (id, dto) => apiFetch(`${EP.zonas}/${id}`, { method: "PUT", body: dto }),
  toggleActivo: (id) => apiFetch(`${EP.zonas}/${id}/activar-desactivar`, { method: "PATCH" }),
  estadisticas: (id) => apiFetch(`${EP.zonas}/${id}/estadisticas`),
};

export const EspaciosApi = {
  getAll: () => apiFetch(EP.espacios),
  getByZona: (idZona) => apiFetch(`${EP.espacios}/zona/${idZona}`),
  create: (dto) => apiFetch(EP.espacios, { method: "POST", body: dto }),
  update: (id, dto) => apiFetch(`${EP.espacios}/${id}`, { method: "PUT", body: dto }),
  toggleActivo: (id) => apiFetch(`${EP.espacios}/${id}/activar-desactivar`, { method: "PATCH" }),
};
