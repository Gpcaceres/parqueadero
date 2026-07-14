package ec.edu.espe.zonas.dtos;

import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoEspacio;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EspacioRequestDto {

    @NotNull(message = "El id de la zona es obligatorio")
    private UUID idZona;

    private String descripcion;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "El tipo de espacio es obligatorio")
    private TipoEspacio tipo;

    @Enumerated(EnumType.STRING)
    private EstadoEspacio estado;
}