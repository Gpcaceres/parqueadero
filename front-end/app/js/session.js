// Sesión guardada tal cual la devuelve POST /auth/login (access_token + user
// con roles ya resueltos) -- nunca se decodifica el JWT a mano en el cliente.
const SESSION_KEY = "parqueadero.session";

export function saveSession({ access_token, user }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: access_token, user }));
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getToken() {
  return getSession()?.token ?? null;
}

export function getCurrentUser() {
  return getSession()?.user ?? null;
}

export function hasAnyRole(...roles) {
  const misRoles = getCurrentUser()?.roles ?? [];
  return roles.some((r) => misRoles.includes(r));
}

// "Empleado" = cualquiera de los 3 roles que operan la caseta (crear/cerrar
// tickets, CRUD de vehículos) -- mismo criterio que EMPLOYEE_ROLES en
// ms-tickets (tickets.controller.ts).
export function isEmpleado() {
  return hasAnyRole("admin", "recaudador", "root");
}

// Se llama al boot de index.html: sin sesión, no hay nada que mostrar.
export function requireAuth() {
  if (!getSession()) {
    window.location.href = "login.html";
  }
}

// Se llama al boot de login.html: si ya hay sesión, no tiene sentido
// mostrar el formulario de nuevo.
export function redirectIfAuthenticated() {
  if (getSession()) {
    window.location.href = "index.html";
  }
}
