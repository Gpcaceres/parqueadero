package ec.edu.espe.zonas.services.impl;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.EspacioRepository;
import ec.edu.espe.zonas.repositorios.ZonaRepository;
import ec.edu.espe.zonas.services.AuditEventPublisher;
import ec.edu.espe.zonas.services.EspacioService;
import ec.edu.espe.zonas.utils.UtilsMappers;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EspacioServicioImpl implements EspacioService {

    private final EspacioRepository repositorioEspacio;
    private final ZonaRepository zonaRepository;
    private final UtilsMappers mapper;
    private final AuditEventPublisher auditEventPublisher;

    @Override
    @Transactional
    public List<EspacioResponseDto> listarEspacios() {
        return repositorioEspacio.findAll().stream()
                .map(mapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EspacioResponseDto obtenerEspacioPorId(UUID idEspacio) {
        Espacio espacio = repositorioEspacio.findById(idEspacio)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + idEspacio));
        
        return mapper.toResponseDto(espacio);
    }

    @Override
    @Transactional
    public List<EspacioResponseDto> listarEspaciosPorZona(UUID idZona) {
        // Validar que la zona existe
        zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));
        
        return repositorioEspacio.findByZonaIdZona(idZona).stream()
                .map(mapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<EspacioResponseDto> listarEspaciosActivos() {
        return repositorioEspacio.findByEstadoEspacio(EstadoEspacio.DISPONIBLE).stream()
                .map(mapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EspacioResponseDto crearEspacio(EspacioRequestDto dto, String ip) {
        Zona objZona = zonaRepository.findById(dto.getIdZona())
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + dto.getIdZona()));
        
        // VALIDACIÓN: Verificar que no se exceda la capacidad de la zona
        if (objZona.getCapacidad() != null && objZona.getCapacidad() > 0) {
            long espaciosActuales = repositorioEspacio.findByZonaIdZona(objZona.getIdZona()).size();
            
            if (espaciosActuales >= objZona.getCapacidad()) {
                throw new RuntimeException(
                    String.format("No se puede crear el espacio. La zona '%s' ha alcanzado su capacidad máxima de %d espacios (actualmente tiene %d espacios).",
                        objZona.getNombre(), objZona.getCapacidad(), espaciosActuales)
                );
            }
        }
        
        Espacio nuevoEspacio = mapper.toEntity(dto);
        nuevoEspacio.setZona(objZona);
        
        // Generar código único automáticamente
        String codigoUnico = generarCodigoUnicoEspacio(objZona.getCodigo());
        nuevoEspacio.setCodigo(codigoUnico);
        
        // El estado inicial se establece en el mapper, pero podemos asegurarnos aquí
        if (nuevoEspacio.getEstadoEspacio() == null) {
            nuevoEspacio.setEstadoEspacio(EstadoEspacio.DISPONIBLE);
        }
        
        Espacio espacioGuardado = repositorioEspacio.save(nuevoEspacio);
        EspacioResponseDto responseDto = mapper.toResponseDto(espacioGuardado);
        auditEventPublisher.publicar("CREATE", "ESPACIO", responseDto, ip);

        return responseDto;
    }
    
    /**
     * Genera un código único para un espacio basado en el código de la zona.
     * Formato: {CODIGO_ZONA}-{NUMERO}
     * Ejemplo: ZONA-1, ZONA-2, ZONB-1, etc.
     */
    private String generarCodigoUnicoEspacio(String codigoZona) {
        int contador = 1;
        String codigoCandidato;
        
        // Intentar códigos secuenciales hasta encontrar uno disponible
        // Máximo 9999 espacios por zona (debería ser más que suficiente)
        while (contador <= 9999) {
            codigoCandidato = codigoZona + "-" + contador;
            
            if (!repositorioEspacio.existsByCodigo(codigoCandidato)) {
                return codigoCandidato;
            }
            contador++;
        }
        
        // Fallback: usar timestamp si se alcanza el límite (muy poco probable)
        return codigoZona + "-" + System.currentTimeMillis();
    }

    @Override
    @Transactional
    public EspacioResponseDto actualizarEspacio(UUID idEspacio, EspacioRequestDto request, String ip) {
        Espacio espacioExistente = repositorioEspacio.findById(idEspacio)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + idEspacio));
        
        Zona objZona = zonaRepository.findById(request.getIdZona())
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + request.getIdZona()));
        
        // Actualizar campos (código es inmutable, no se modifica)
        espacioExistente.setDescripcion(request.getDescripcion());
        espacioExistente.setTipo(request.getTipo());
        espacioExistente.setZona(objZona);
        
        // Actualizar estado si viene en la request
        if (request.getEstado() != null) {
            espacioExistente.setEstadoEspacio(request.getEstado());
        }
        
        Espacio espacioActualizado = repositorioEspacio.save(espacioExistente);
        EspacioResponseDto responseDto = mapper.toResponseDto(espacioActualizado);
        auditEventPublisher.publicar("UPDATE", "ESPACIO", responseDto, ip);

        return responseDto;
    }

    @Override
    @Transactional
    public void activarDesactivar(UUID idEspacio, String ip) {
        Espacio espacio = repositorioEspacio.findById(idEspacio)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado con ID: " + idEspacio));

        // Alternar entre DISPONIBLE e INACTIVO
        if (espacio.getEstadoEspacio() == EstadoEspacio.INACTIVO) {
            espacio.setEstadoEspacio(EstadoEspacio.DISPONIBLE);
        } else {
            espacio.setEstadoEspacio(EstadoEspacio.INACTIVO);
        }

        Espacio espacioActualizado = repositorioEspacio.save(espacio);
        auditEventPublisher.publicar("UPDATE", "ESPACIO", mapper.toResponseDto(espacioActualizado), ip);
    }
}