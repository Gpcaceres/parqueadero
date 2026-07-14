package ec.edu.espe.zonas.services;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;

import java.util.List;
import java.util.UUID;

public interface EspacioService {

    List<EspacioResponseDto> listarEspacios();

    EspacioResponseDto obtenerEspacioPorId(UUID idEspacio);

    List<EspacioResponseDto> listarEspaciosPorZona(UUID idZona);

    List<EspacioResponseDto> listarEspaciosActivos();

    EspacioResponseDto crearEspacio(EspacioRequestDto requestDto, String ip, String usuario, String rol);

    EspacioResponseDto actualizarEspacio(UUID idEspacio, EspacioRequestDto request, String ip, String usuario, String rol);

    void activarDesactivar(UUID idEspacio, String ip, String usuario, String rol);
}