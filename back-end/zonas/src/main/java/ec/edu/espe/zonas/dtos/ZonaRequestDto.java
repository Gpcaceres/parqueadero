package ec.edu.espe.zonas.dtos;

import ec.edu.espe.zonas.entidades.TipoZona;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para crear/actualizar una Zona de parqueo.
 * Una Zona CONTIENE múltiples Espacios de estacionamiento.
 * El código se genera AUTOMÁTICAMENTE basado en el nombre.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaRequestDto {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 1, max = 32, message = "El nombre debe tener entre 1 y 32 caracteres")
    private String nombre;

    private String descripcion;

    @NotNull(message = "El tipo de zona es obligatorio")
    private TipoZona tipoZona;

    @Min(value = 0, message = "La capacidad no puede ser negativa")
    private Integer capacidad; // Capacidad máxima de espacios para esta zona (opcional, mínimo 0)
    
}