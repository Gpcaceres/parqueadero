package ec.edu.espe.zonas.services;

import ec.edu.espe.zonas.dtos.EstadisticasZonaDto;
import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;

import java.util.List;
import java.util.UUID;

public interface ZonaServicio {

    List<ZonaResponseDto> listarZonas();

    ZonaResponseDto crearZona(ZonaRequestDto requestDto);

    ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto request);

    void activarDesactivar(UUID idZona);

    EstadisticasZonaDto obtenerEstadisticas(UUID idZona);
}