package ec.edu.espe.zonas.dtos;

import ec.edu.espe.zonas.entidades.TipoZona;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO de respuesta para una Zona de parqueo.
 * Una Zona CONTIENE múltiples Espacios de estacionamiento.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaResponseDto {

    private UUID id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private int estado; // 1: activo - 0: inactivo
    private TipoZona tipo;
    private int capacidad; // Capacidad máxima planificada
    private long totalEspacios; // Total de espacios creados en esta zona
}