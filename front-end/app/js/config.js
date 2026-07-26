// Todo pasa por Kong (API Gateway), nunca directo a los microservicios.
export const KONG_URL = "http://localhost:8000";

export const EP = {
  authLogin: `${KONG_URL}/auth/login`,
  personas: `${KONG_URL}/personas`,
  users: `${KONG_URL}/users`,
  roles: `${KONG_URL}/roles`,
  userRole: `${KONG_URL}/user-role`,
  vehiculos: `${KONG_URL}/vehiculos`,
  tickets: `${KONG_URL}/tickets`,
  ticketsEstadisticas: `${KONG_URL}/tickets/estadisticas`,
  reservas: `${KONG_URL}/reservas`,
  zonas: `${KONG_URL}/api/v1/zonas`,
  espacios: `${KONG_URL}/api/v1/espacios`,
  sseEspacios: `${KONG_URL}/sse/espacios`,
  audit: `${KONG_URL}/audit`,
};
