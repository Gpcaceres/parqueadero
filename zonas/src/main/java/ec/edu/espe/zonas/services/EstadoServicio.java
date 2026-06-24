package ec.edu.espe.zonas.services;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;

import java.util.List;
import java.util.UUID;

public interface EstadoServicio {
    List<EspacioResponseDto> obtenenerEspacios();
    EspacioResponseDto crearEspacio(EspacioRequestDto requestDto);
    EspacioResponseDto actualizarEspacio(EspacioRequestDto dto);
    void eliminarEspacio(UUID idEspacio);
    EspacioResponseDto cambiarEstado(EspacioRequestDto dto);
    List<EspacioResponseDto> obtenerlEspacioPorEstado(EstadoEspacio estado);
    List<EspacioResponseDto> obtenerlEspacioPorZona(UUID idZona, EstadoEspacio estado);
}
