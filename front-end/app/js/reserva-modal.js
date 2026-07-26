import { ReservasApi } from "./api.js";
import { openModal, closeModal, toast } from "./ui.js";

const ANTICIPACION_MINIMA_MIN = 60;

// Combina la fecha de HOY con el "HH:MM" del <input type="time"> -- la
// reserva siempre es para el mismo día, no hace falta elegir fecha.
function horaDeHoy(valorInput) {
  const [horas, minutos] = valorInput.split(":").map(Number);
  const fecha = new Date();
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
}

let idEspacioActivo = null;
let onReservaSuccess = null;

export function abrirModalReservar(idEspacio, onSuccess) {
  idEspacioActivo = idEspacio;
  onReservaSuccess = onSuccess;
  document.getElementById("formReservar").reset();
  document.getElementById("reservarError").classList.add("hidden");
  openModal("modalReservar");
}

function wireModalReservar() {
  document.getElementById("btnCancelarReservar").addEventListener("click", () => {
    closeModal("modalReservar");
  });

  document.getElementById("formReservar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("reservarError");
    errorBox.classList.add("hidden");

    const valorHora = document.getElementById("reservarHora").value;
    if (!valorHora) {
      errorBox.textContent = "Elige una hora para la reserva.";
      errorBox.classList.remove("hidden");
      return;
    }

    const horaReserva = horaDeHoy(valorHora);
    const minutosDeAnticipacion = (horaReserva.getTime() - Date.now()) / 60000;
    if (minutosDeAnticipacion < ANTICIPACION_MINIMA_MIN) {
      errorBox.textContent = `La reserva debe hacerse con al menos ${ANTICIPACION_MINIMA_MIN} minutos de anticipación.`;
      errorBox.classList.remove("hidden");
      return;
    }

    try {
      await ReservasApi.create({
        id_espacio: idEspacioActivo,
        hora_reserva: horaReserva.toISOString(),
      });
      closeModal("modalReservar");
      toast("Espacio reservado correctamente", "exito");
      onReservaSuccess?.();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    }
  });
}

wireModalReservar();
