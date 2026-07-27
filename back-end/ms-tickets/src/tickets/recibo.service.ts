import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Ticket, TipoTarifa } from './entities/ticket.entity';
import { ZoneIntegrationService } from './zone-integration.service';
import { PersonaIntegrationService } from './persona-integration.service';

function formatearFechaCorta(fecha?: Date | null): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-EC', {
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ETIQUETA_TARIFA: Record<TipoTarifa, string> = {
  [TipoTarifa.MENSUAL]: 'Mensual',
  [TipoTarifa.POR_HORA]: 'Por hora o fracción',
  [TipoTarifa.NOCTURNO]: 'Nocturno (19:00 - 07:00)',
};

function formatearFecha(fecha?: Date | null): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-EC', { hour12: false });
}

// Mismo criterio que formatearDuracion() en el frontend (front-end/app/js/ui.js):
// HH:MM:SS, o "Dd HH:MM:SS" si pasa de un día.
function formatearDuracion(desde: Date, hasta: Date): string {
  const totalSeg = Math.max(0, Math.floor((hasta.getTime() - desde.getTime()) / 1000));
  const dias = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
  return dias > 0 ? `${dias}d ${base}` : base;
}

function formatearMoneda(valor?: number | null): string {
  return valor === null || valor === undefined ? 'N/A' : `$${Number(valor).toFixed(2)}`;
}

/**
 * Genera el recibo en PDF de un ticket -- se ofrece para descargar apenas se
 * registra la salida (ver TicketsController#recibo), pero también funciona
 * para un ticket todavía activo (sin salida), mostrando el cobro "en curso"
 * en vez del monto final.
 */
@Injectable()
export class ReciboService {
  constructor(
    private readonly zoneIntegrationService: ZoneIntegrationService,
    private readonly personaIntegrationService: PersonaIntegrationService,
  ) {}

  async generarPdf(ticket: Ticket): Promise<Buffer> {
    const [codigoEspacio, nombreUsuario] = await Promise.all([
      this.zoneIntegrationService.obtenerCodigo(ticket.id_espacio),
      this.personaIntegrationService.obtenerNombreCompleto(ticket.id_usuario),
    ]);

    const fechaIngreso = new Date(ticket.fecha_hora_ingreso);
    const fechaSalida = ticket.fecha_hora_salida ? new Date(ticket.fecha_hora_salida) : null;
    const enCurso = !fechaSalida;
    const duracion = formatearDuracion(fechaIngreso, fechaSalida ?? new Date());

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 42 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const linea = () =>
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .strokeColor('#cbd5e1')
          .stroke()
          .moveDown(0.6);

      const fila = (etiqueta: string, valor: string) => {
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text(etiqueta, { continued: true });
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(`  ${valor}`);
      };

      doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text('RECIBO DE PARQUEADERO', { align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Parqueadero ESPE - Sistema Inteligente de Gestión', { align: 'center' });
      doc.moveDown(1);
      linea();

      fila('Ticket:', ticket.id_ticket);
      fila('Espacio:', codigoEspacio ?? ticket.id_espacio);
      fila('Vehículo:', `${ticket.id_vehiculo} (${ticket.tipo_vehiculo})`);
      fila('Cliente:', nombreUsuario ?? 'No disponible');
      doc.moveDown(0.6);
      linea();

      fila('Ingreso:', formatearFecha(fechaIngreso));
      fila('Salida:', enCurso ? 'Aún en el parqueadero' : formatearFecha(fechaSalida));
      fila('Duración:', duracion);
      fila('Tarifa:', ETIQUETA_TARIFA[ticket.tipo_tarifa] ?? ticket.tipo_tarifa);
      doc.moveDown(0.6);
      linea();

      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).fillColor('#475569').text(enCurso ? 'TOTAL EN CURSO' : 'TOTAL PAGADO', { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#0cb669').text(formatearMoneda(ticket.valor_recaudado), { align: 'center' });

      doc.moveDown(1.2);
      doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(`Emitido el ${formatearFecha(new Date())}`, { align: 'center' });

      doc.end();
    });
  }

  // Reporte consolidado de un rango de fechas (ver TicketsController#reporte
  // -- filtra por fecha de ingreso, igual que findAll). Resuelve el código
  // de cada espacio con una sola llamada por espacio ÚNICO en el rango (no
  // una por ticket), para no multiplicar peticiones a "zonas" en reportes
  // con muchos tickets repitiendo el mismo espacio.
  async generarReportePdf(tickets: Ticket[], desde: string, hasta: string): Promise<Buffer> {
    const idsEspacioUnicos = [...new Set(tickets.map((t) => t.id_espacio))];
    const codigosPorEspacio = new Map<string, string>();
    await Promise.all(
      idsEspacioUnicos.map(async (id) => {
        const codigo = await this.zoneIntegrationService.obtenerCodigo(id);
        codigosPorEspacio.set(id, codigo ?? id.slice(0, 8));
      }),
    );

    const totalRecaudado = tickets.reduce((acc, t) => acc + (Number(t.valor_recaudado) || 0), 0);
    const conteoPorEstado = tickets.reduce(
      (acc, t) => ({ ...acc, [t.estado_ticket]: (acc[t.estado_ticket] ?? 0) + 1 }),
      {} as Record<string, number>,
    );

    // [x, ancho] de cada columna -- suman ~515pt, el ancho útil de A4 con
    // margen 40 a cada lado (595 - 80).
    const columnas = [
      { titulo: 'Espacio', x: 40, ancho: 60 },
      { titulo: 'Vehículo', x: 100, ancho: 85 },
      { titulo: 'Ingreso', x: 185, ancho: 95 },
      { titulo: 'Salida', x: 280, ancho: 95 },
      { titulo: 'Tarifa', x: 375, ancho: 70 },
      { titulo: 'Estado', x: 445, ancho: 55 },
      { titulo: 'Recaudado', x: 500, ancho: 55 },
    ];

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pieDePagina = doc.page.height - doc.page.margins.bottom;

      // doc.rect().fill() dibuja el rectángulo pero NO avanza doc.y (a
      // diferencia de doc.text()) -- hay que guardar la posición antes de
      // dibujarlo y avanzar el cursor a mano después, o el encabezado queda
      // dibujado "flotando" en la posición vieja y el texto blanco termina
      // fuera del rectángulo oscuro (invisible sobre fondo blanco).
      const dibujarEncabezadoTabla = () => {
        const filaY = doc.y;
        doc.rect(40, filaY, 515, 16).fill('#0f172a');
        doc.font('Helvetica-Bold').fontSize(8);
        columnas.forEach((c) => doc.fillColor('#ffffff').text(c.titulo, c.x, filaY + 4, { width: c.ancho }));
        doc.x = 40;
        doc.y = filaY + 20;
        doc.fillColor('#0f172a');
      };

      doc.font('Helvetica-Bold').fontSize(16).text('REPORTE DE TICKETS', { align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Parqueadero ESPE - Sistema Inteligente de Gestión', { align: 'center' });
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(`Período: ${desde} a ${hasta}`, { align: 'center' });
      doc.moveDown(1);

      if (tickets.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No hay tickets registrados en este período.', { align: 'center' });
        doc.end();
        return;
      }

      dibujarEncabezadoTabla();

      doc.font('Helvetica').fontSize(8);
      tickets.forEach((t, i) => {
        if (doc.y > pieDePagina - 20) {
          doc.addPage();
          dibujarEncabezadoTabla();
          doc.font('Helvetica').fontSize(8);
        }
        if (i % 2 === 0) {
          doc.rect(40, doc.y, 515, 14).fill('#f8fafc');
        }
        const y = doc.y + 3;
        doc.fillColor('#0f172a');
        doc.text(codigosPorEspacio.get(t.id_espacio) ?? '—', columnas[0].x, y, { width: columnas[0].ancho });
        doc.text(`${t.id_vehiculo}`, columnas[1].x, y, { width: columnas[1].ancho });
        doc.text(formatearFechaCorta(t.fecha_hora_ingreso), columnas[2].x, y, { width: columnas[2].ancho });
        doc.text(formatearFechaCorta(t.fecha_hora_salida), columnas[3].x, y, { width: columnas[3].ancho });
        doc.text(ETIQUETA_TARIFA[t.tipo_tarifa] ?? t.tipo_tarifa, columnas[4].x, y, { width: columnas[4].ancho });
        doc.text(t.estado_ticket, columnas[5].x, y, { width: columnas[5].ancho });
        doc.text(formatearMoneda(t.valor_recaudado), columnas[6].x, y, { width: columnas[6].ancho });
        doc.y = y + 11;
      });

      // Sin esto, doc.x/el ancho de flujo del texto quedan heredados de la
      // última celda de la tabla (x=500, ancho=55) -- el resumen de abajo se
      // cortaba en líneas de 4-5 caracteres ("Total de" / "tickets: 3").
      doc.x = 40;
      doc.moveDown(1.2);
      doc
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .strokeColor('#cbd5e1')
        .stroke()
        .moveDown(0.5);

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
      doc.text(`Total de tickets: ${tickets.length}`);
      Object.entries(conteoPorEstado).forEach(([estado, cantidad]) => {
        doc.text(`  ${estado}: ${cantidad}`);
      });
      doc.moveDown(0.3);
      doc.fontSize(13).fillColor('#0cb669').text(`Total recaudado: ${formatearMoneda(totalRecaudado)}`);

      doc.moveDown(1);
      doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(`Emitido el ${formatearFecha(new Date())}`);

      doc.end();
    });
  }
}
