import { TipoTarifa } from './entities/ticket.entity';

/**
 * Montos base de cada plan de tarifa. POR_HORA se cobra por hora o fracción
 * (cualquier fracción de hora cuenta como una hora completa).
 */
export const TARIFAS: Record<TipoTarifa, number> = {
  [TipoTarifa.MENSUAL]: 25,
  [TipoTarifa.POR_HORA]: 0.5,
  [TipoTarifa.NOCTURNO]: 3,
};

const MS_POR_HORA = 60 * 60 * 1000;
const HORA_FIN_NOCTURNO = 7; // 7:00 a.m.

/** Redondea hacia arriba a la hora completa; mínimo 1 hora cobrada. */
function horasPorFraccion(ms: number): number {
  return Math.max(1, Math.ceil(ms / MS_POR_HORA));
}

/**
 * Calcula el valor a recaudar según el plan elegido al crear el ticket:
 * - MENSUAL: monto fijo, sin importar el tiempo parqueado.
 * - POR_HORA: horas o fracción de hora transcurridas × tarifa por hora.
 * - NOCTURNO: monto fijo nocturno; el horario nocturno corre de 19:00 a
 *   07:00. Si la salida ocurre después de las 07:00 siguientes al ingreso,
 *   el tiempo extra se cobra por hora o fracción (tarifa POR_HORA).
 */
export function calcularValorRecaudado(
  tipoTarifa: TipoTarifa,
  fechaIngreso: Date,
  fechaSalida: Date,
): number {
  switch (tipoTarifa) {
    case TipoTarifa.MENSUAL:
      return TARIFAS[TipoTarifa.MENSUAL];

    case TipoTarifa.POR_HORA: {
      const horas = horasPorFraccion(fechaSalida.getTime() - fechaIngreso.getTime());
      return redondear(horas * TARIFAS[TipoTarifa.POR_HORA]);
    }

    case TipoTarifa.NOCTURNO: {
      // Corte: las 07:00 siguientes al ingreso (mismo día si el ingreso ya
      // fue después de medianoche, o el día siguiente si el ingreso fue en
      // la noche anterior).
      const corte = new Date(fechaIngreso);
      corte.setHours(HORA_FIN_NOCTURNO, 0, 0, 0);
      if (corte <= fechaIngreso) {
        corte.setDate(corte.getDate() + 1);
      }

      let total = TARIFAS[TipoTarifa.NOCTURNO];
      if (fechaSalida > corte) {
        const horasExtra = horasPorFraccion(fechaSalida.getTime() - corte.getTime());
        total += horasExtra * TARIFAS[TipoTarifa.POR_HORA];
      }
      return redondear(total);
    }

    default:
      throw new Error(`Tipo de tarifa desconocido: ${tipoTarifa}`);
  }
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
