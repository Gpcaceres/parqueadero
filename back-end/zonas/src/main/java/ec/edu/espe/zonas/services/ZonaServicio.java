package ec.edu.espe.zonas.services;

import ec.edu.espe.zonas.dtos.EstadisticasZonaDto;
import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;

import java.util.List;
import java.util.UUID;

public interface ZonaServicio {

    List<ZonaResponseDto> listarZonas();

    ZonaResponseDto crearZona(ZonaRequestDto requestDto, String ip, String usuario, String rol);

    ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto request, String ip, String usuario, String rol);

    void activarDesactivar(UUID idZona, String ip, String usuario, String rol);

    EstadisticasZonaDto obtenerEstadisticas(UUID idZona);
}