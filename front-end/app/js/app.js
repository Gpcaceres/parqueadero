import { requireAuth, getCurrentUser, isEmpleado, hasAnyRole, clearSession } from "./session.js";
import { initEspaciosTab } from "./espacios.js";
import { initTicketsTab } from "./tickets.js";
import { initVehiculosTab } from "./vehiculos.js";
import { initZonasTab } from "./zonas.js";
import { initUsuariosTab } from "./usuarios.js";
import { initAuditTab } from "./audit.js";

requireAuth();

const user = getCurrentUser();
document.getElementById("userBadge").textContent = `${user.username} (${user.roles.join(", ")})`;

document.getElementById("tabBtnTickets").textContent = isEmpleado() ? "Todos los tickets" : "Mis tickets";

// Vehículos y Zonas/Espacios: mismo set de roles "empleado" que ya opera
// tickets (admin, recaudador, root -- ver EMPLOYEE_ROLES/WriteAuthorizationFilter).
// Personas/Usuarios y Auditoría: exclusivos de admin/root en el backend.
if (isEmpleado()) {
  document.getElementById("tabBtnVehiculos").classList.remove("hidden");
  document.getElementById("tabBtnZonas").classList.remove("hidden");
}
if (hasAnyRole("admin", "root")) {
  document.getElementById("tabBtnUsuarios").classList.remove("hidden");
  document.getElementById("tabBtnAuditoria").classList.remove("hidden");
}

document.getElementById("btnLogout").addEventListener("click", () => {
  clearSession();
  window.location.href = "login.html";
});

const initPorTab = {
  espacios: initEspaciosTab,
  tickets: initTicketsTab,
  vehiculos: initVehiculosTab,
  zonas: initZonasTab,
  usuarios: initUsuariosTab,
  auditoria: initAuditTab,
};

function activarTab(nombre) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const activo = btn.dataset.tab === nombre;
    btn.classList.toggle("bg-brand-600", activo);
    btn.classList.toggle("text-white", activo);
    btn.classList.toggle("shadow-md", activo);
    btn.classList.toggle("shadow-brand-500/30", activo);
    btn.classList.toggle("text-slate-500", !activo);
    btn.classList.toggle("hover:bg-slate-100", !activo);
    btn.classList.toggle("hover:text-slate-700", !activo);
  });
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tabPanel !== nombre);
  });
  initPorTab[nombre]?.();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => activarTab(btn.dataset.tab));
});

activarTab("espacios");
