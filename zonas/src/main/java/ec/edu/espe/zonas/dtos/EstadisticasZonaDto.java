package ec.edu.espe.zonas.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadisticasZonaDto {
    private UUID idZona;
    private String nombreZona;
    private long totalEspacios;
    private long espaciosDisponibles;
    private long espaciosOcupados;
    private long espaciosEnMantenimiento;
    private long espaciosInactivos;
    private double porcentajeOcupacion; // (ocupados / (total - inactivos)) * 100
    private boolean puedeDesactivarse; // true si no hay espacios ocupados ni en mantenimiento
}
