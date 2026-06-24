package ec.edu.espe.zonas.utils;

import org.springframework.stereotype.Component;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;

@Component
public class UtilsMappers {
    
    public EspacioResponseDto toResponseDto(Espacio objEspacio) {
        if (objEspacio == null) return null;
        return EspacioResponseDto.builder()
                .id(objEspacio.getId())
                .codigo(objEspacio.getCodigo())
                .descripcion(objEspacio.getDescripcion())
                .tipo(objEspacio.getTipo())
                .estadoEspacio(objEspacio.getEstadoEspacio())
                .idZona(objEspacio.getZona().getId())
                .estadoZona(objEspacio.getZona().getEstado())
                .build();
    }

    public Espacio toEntity(EspacioRequestDto requestDto) {
        if (requestDto == null) return null;
        return Espacio.builder()
                .descripcion(requestDto.getDescripcion())
                .tipo(requestDto.getTipo())
                .estadoEspacio(requestDto.getEstado() != null ? requestDto.getEstado() : ec.edu.espe.zonas.entidades.EstadoEspacio.DISPONIBLE)
                .build();
    }
}
