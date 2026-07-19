// Todo pasa por Kong (API Gateway), igual que el resto de clientes del sistema.
const KONG_URL = "http://localhost:8000";
const API_ESPACIOS = `${KONG_URL}/api/v1/espacios`;
const API_ZONAS = `${KONG_URL}/api/v1/zonas`;
const API_TICKETS = `${KONG_URL}/tickets`;
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

// Para cada espacio OCUPADO se busca su ticket activo (ms-tickets ya lo
// enriquece con nombre_usuario, ver PersonaIntegrationService). Los demás
// estados no tienen ticket que mostrar, así que no se consultan.
const obtenerMapaTickets = async (espacios) => {
  const ocupados = espacios.filter((esp) => esp.estadoEspacio === "OCUPADO");
  const tickets = await Promise.all(
    ocupados.map((esp) => fetchJson(`${API_TICKETS}/espacio/${esp.idEspacio}`)),
  );
  const mapa = new Map();
  ocupados.forEach((esp, i) => {
    if (tickets[i]) mapa.set(esp.idEspacio, tickets[i]);
  });
  return mapa;
};

// Duración transcurrida en formato HH:MM:SS (o "Dd HH:MM:SS" si pasa de un
// día), recalculada cada segundo por actualizarContadores().
const formatearDuracion = (ms) => {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const base = `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
  return dias > 0 ? `${dias}d ${base}` : base;
};

// Mismas reglas y montos que back-end/ms-tickets/src/tickets/tarifas.ts:
// se replican aquí solo para poder mostrar en vivo, en la tarjeta, el valor
// que se cobraría SI la salida se registrara ahora mismo. El monto real y
// definitivo siempre lo calcula el backend en registrarSalida; esto es una
// vista previa, no la fuente de verdad del cobro.
const TARIFAS = { MENSUAL: 25, POR_HORA: 0.5, NOCTURNO: 3 };
const MS_POR_HORA = 60 * 60 * 1000;
const HORA_FIN_NOCTURNO = 7;

const horasPorFraccion = (ms) => Math.max(1, Math.ceil(ms / MS_POR_HORA));
const redondear = (valor) => Math.round(valor * 100) / 100;

const calcularValorEnCurso = (tipoTarifa, fechaIngreso, ahora) => {
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

const formatearMoneda = (valor) => `$${valor.toFixed(2)}`;

const actualizarContadores = () => {
  const ahora = Date.now();
  document.querySelectorAll(".contador-tiempo").forEach((el) => {
    const ingreso = new Date(el.dataset.ingreso).getTime();
    el.textContent = formatearDuracion(ahora - ingreso);
  });
  document.querySelectorAll(".valor-en-curso").forEach((el) => {
    const ingreso = new Date(el.dataset.ingreso).getTime();
    const valor = calcularValorEnCurso(el.dataset.tarifa, ingreso, ahora);
    el.textContent = valor === null ? "N/A" : formatearMoneda(valor);
  });
};

const renderizarTarjetaEspacio = (esp, nombreZona, ticket) => {
  const estado = esp.estadoEspacio;
  const estadoClass = `bg-${estado.toLowerCase()}`;

  const infoTicket = ticket
    ? `
                <div class="mt-2 pt-2 border-t border-black/10 text-xs text-gray-700 space-y-0.5">
                    <div>👤 ${ticket.nombre_usuario || "Usuario no disponible"}</div>
                    <div>🚗 ${ticket.id_vehiculo} · ${ticket.tipo_vehiculo}</div>
                    <div>🕐 Entrada: ${formatDate(ticket.fecha_hora_ingreso)}</div>
                    <div>⏱️ <span class="font-semibold contador-tiempo" data-ingreso="${ticket.fecha_hora_ingreso}">--:--:--</span></div>
                    <div>💲 En curso (${ticket.tipo_tarifa}):
                        <span class="font-semibold valor-en-curso" data-ingreso="${ticket.fecha_hora_ingreso}" data-tarifa="${ticket.tipo_tarifa}">--</span>
                    </div>
                </div>`
    : "";

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
                ${infoTicket}
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
  return [...grupos.values()].sort((a, b) =>
    a.nombreZona.localeCompare(b.nombreZona, "es"),
  );
};

const renderizarEspacios = (espacios, mapaZonas, mapaTickets) => {
  if (!espacios || espacios.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p class="text-xl">No hay espacios disponibles</p>
            </div>
        `;
    totalSpan.textContent = "0 espacios";
    return;
  }

  const grupos = agruparPorZona(espacios, mapaZonas);

  const html = grupos
    .map(({ nombreZona, espacios: espaciosZona }) => {
      const disponibles = espaciosZona.filter(
        (e) => e.estadoEspacio === "DISPONIBLE",
      ).length;
      const tarjetas = espaciosZona
        .map((esp) =>
          renderizarTarjetaEspacio(esp, nombreZona, mapaTickets.get(esp.idEspacio)),
        )
        .join("");

      return `
            <section>
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-xl font-semibold text-gray-800">Zona: ${nombreZona}</h2>
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

const cargarEspacios = async () => {
  const [espacios, mapaZonas] = await Promise.all([
    fetchJson(API_ESPACIOS),
    obtenerMapaZonas(),
  ]);
  if (espacios) {
    const mapaTickets = await obtenerMapaTickets(espacios);
    renderizarEspacios(espacios, mapaZonas, mapaTickets);
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

  // Contador de tiempo transcurrido de cada espacio ocupado: se recalcula
  // cada segundo sobre el DOM ya renderizado, sin volver a pedir datos.
  setInterval(actualizarContadores, 1000);
})();
