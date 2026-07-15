// Todo pasa por Kong (API Gateway), igual que el resto de clientes del sistema.
const KONG_URL = "http://localhost:8000";
const API_ESPACIOS = `${KONG_URL}/api/v1/espacios`;
const API_ZONAS = `${KONG_URL}/api/v1/zonas`;
const SSE_URL = `${KONG_URL}/sse/espacios`;

const container = document.getElementById("espaciosContainer");
const totalSpan = document.getElementById("totalEspacios");
const lastUpdateSpan = document.getElementById("lastUpdate");
const indicator = document.getElementById("indicator");
const statusText = document.getElementById("statusText");

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleString("es-ES", { hour12: false });
};

const setConnectionStatus = (connected) => {
  if (connected) {
    indicator.className = "w-3 h-3 bg-green-500 rounded-full inline-block";
    statusText.textContent = "Conectado";
  } else {
    indicator.className = "w-3 h-3 bg-red-500 rounded-full inline-block";
    statusText.textContent = "Desconectado";
  }
};

const fetchJson = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener ${url}:`, error);
    return null;
  }
};

// Color del badge por estado (debe cubrir los 5 valores de EstadoEspacio en
// el backend: DISPONIBLE, OCUPADO, RESERVADO, MANTENIMIENTO, INACTIVO).
const BADGE_CLASS_POR_ESTADO = {
  DISPONIBLE: "bg-green-200 text-green-800",
  OCUPADO: "bg-red-200 text-red-800",
  RESERVADO: "bg-violet-200 text-violet-800",
  MANTENIMIENTO: "bg-amber-200 text-amber-800",
  INACTIVO: "bg-gray-200 text-gray-800",
};

// El servicio de zonas no incluye el nombre de la zona en cada espacio, así
// que se resuelve aparte con un mapa idZona -> nombre.
const obtenerMapaZonas = async () => {
  const zonas = await fetchJson(API_ZONAS);
  const mapa = new Map();
  (zonas || []).forEach((zona) => mapa.set(zona.idZona, zona.nombre));
  return mapa;
};

const renderizarEspacios = (espacios, mapaZonas) => {
  if (!espacios || espacios.length === 0) {
    container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <p class="text-xl">No hay espacios disponibles</p>
            </div>
        `;
    totalSpan.textContent = "0 espacios";
    return;
  }

  const html = espacios
    .map((esp) => {
      const estado = esp.estadoEspacio;
      const estadoClass = `bg-${estado.toLowerCase()}`;
      const nombreZona = mapaZonas.get(esp.idZona) || "N/A";
      return `
            <div class="espacio-card ${estadoClass} rounded-lg shadow p-4 flex flex-col">
                <div class="font-bold text-lg text-gray-800">${esp.codigo || "Sin código"}</div>
                <div class="text-sm text-gray-600">Zona: ${nombreZona}</div>
                <div class="text-sm text-gray-600">Tipo: ${esp.tipo || "N/A"}</div>
                <div class="mt-2 flex items-center justify-between">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full
                        ${BADGE_CLASS_POR_ESTADO[estado] || "bg-yellow-200 text-yellow-800"}">
                        ${estado}
                    </span>
                    <span class="text-xs text-gray-400">ID: ${esp.idEspacio.slice(0, 8)}</span>
                </div>
            </div>
        `;
    })
    .join("");

  container.innerHTML = html;
  totalSpan.textContent = `${espacios.length} espacios`;
  lastUpdateSpan.textContent = formatDate(new Date());
};

const cargarEspacios = async () => {
  const [espacios, mapaZonas] = await Promise.all([
    fetchJson(API_ESPACIOS),
    obtenerMapaZonas(),
  ]);
  if (espacios) {
    renderizarEspacios(espacios, mapaZonas);
    setConnectionStatus(true);
  } else {
    setConnectionStatus(false);
  }
};

//sse
const conectarSSE = () => {
  const eventSource = new EventSource(SSE_URL);

  eventSource.onopen = () => {
    console.log("SSE: conexión establecida");
    setConnectionStatus(true);
  };

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      console.log("SSE recibido:", payload);
      // Cada vez que recibimos un evento, recargamos todos los espacios
      // (también sirve para reflejar nuevos espacios insertados)
      cargarEspacios();
    } catch (e) {
      console.error("Error al parsear evento SSE:", e);
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    setConnectionStatus(false);
    eventSource.close();
    // Reintentar después de 5 segundos
    setTimeout(conectarSSE, 5000);
  };

  return eventSource;
};

(async () => {
  // Cargar espacios al inicio
  await cargarEspacios();

  // Conectar SSE
  conectarSSE();

  // Actualización periódica cada 30 segundos por si el SSE falla
  setInterval(cargarEspacios, 30000);
})();
