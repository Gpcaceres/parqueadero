package ec.edu.espe.zonas.services.impl;

import ec.edu.espe.zonas.dtos.EstadisticasZonaDto;
import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.EspacioRepository;
import ec.edu.espe.zonas.repositorios.ZonaRepository;
import ec.edu.espe.zonas.services.ZonaServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ZonaServicioImpl implements ZonaServicio {

    private final ZonaRepository zonaRepository;
    private final EspacioRepository espacioRepository;

    @Override
    public List<ZonaResponseDto> listarZonas() {
        // Busca todas las zonas y las convierte de Entidad a DTO
        return zonaRepository.findAll().stream()
                .map(this::convertirADto)
                .toList();
    }

    @Override
    public ZonaResponseDto crearZona(ZonaRequestDto requestDto) {
        // Validación adicional: La capacidad no puede ser negativa
        if (requestDto.getCapacidad() != null && requestDto.getCapacidad() < 0) {
            throw new IllegalArgumentException("La capacidad no puede ser un valor negativo");
        }

        // Generar código único automáticamente
        String codigoUnico = generarCodigoUnico(requestDto.getNombre());

        Zona zona = Zona.builder()
                .nombre(requestDto.getNombre())
                .descripcion(requestDto.getDescripcion())
                .tipo(requestDto.getTipoZona())
                .estado(1) // 1 significa Activo al crear
                .codigo(codigoUnico)
                .capacidad(requestDto.getCapacidad() != null ? requestDto.getCapacidad() : 0)
                .build();

        Zona zonaGuardada = zonaRepository.save(zona);
        return convertirADto(zonaGuardada);
    }

    @Override
    public ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto request) {
        // Validación adicional: La capacidad no puede ser negativa
        if (request.getCapacidad() != null && request.getCapacidad() < 0) {
            throw new IllegalArgumentException("La capacidad no puede ser un valor negativo");
        }

        // Buscamos la zona, si no existe lanzamos error
        Zona zonaExistente = zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));

        // Actualizamos los datos (el código NO se actualiza, es inmutable)
        zonaExistente.setNombre(request.getNombre());
        zonaExistente.setDescripcion(request.getDescripcion());
        zonaExistente.setTipo(request.getTipoZona());
        
        // Actualizar capacidad si se proporciona
        if (request.getCapacidad() != null) {
            zonaExistente.setCapacidad(request.getCapacidad());
        }

        Zona zonaActualizada = zonaRepository.save(zonaExistente);
        return convertirADto(zonaActualizada);
    }

    @Override
    public void activarDesactivar(UUID idZona) {
        Zona zonaExistente = zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));

        // 🔒 REGLA DE NEGOCIO: Validar antes de desactivar
        if (zonaExistente.getEstado() == 1) { // Si está activa y se quiere desactivar
            // Verificar si hay espacios OCUPADOS en la zona
            boolean hayEspaciosOcupados = espacioRepository
                    .existsByZonaIdZonaAndEstadoEspacio(idZona, EstadoEspacio.OCUPADO);
            
            if (hayEspaciosOcupados) {
                throw new RuntimeException(
                    "No se puede desactivar la zona. Existen espacios ocupados. " +
                    "Por favor, libere todos los espacios antes de desactivar la zona."
                );
            }
            
            // Opcionalmente, también verificar espacios en MANTENIMIENTO
            boolean hayEspaciosEnMantenimiento = espacioRepository
                    .existsByZonaIdZonaAndEstadoEspacio(idZona, EstadoEspacio.MANTENIMIENTO);
            
            if (hayEspaciosEnMantenimiento) {
                throw new RuntimeException(
                    "No se puede desactivar la zona. Existen espacios en mantenimiento. " +
                    "Por favor, finalice el mantenimiento antes de desactivar la zona."
                );
            }
        }

        // Si pasa todas las validaciones, cambiar el estado
        int nuevoEstado = zonaExistente.getEstado() == 1 ? 0 : 1;
        zonaExistente.setEstado(nuevoEstado);

        zonaRepository.save(zonaExistente);
    }

    @Override
    public EstadisticasZonaDto obtenerEstadisticas(UUID idZona) {
        Zona zona = zonaRepository.findById(idZona)
                .orElseThrow(() -> new RuntimeException("Zona no encontrada con ID: " + idZona));

        // Contar espacios por estado
        long totalEspacios = espacioRepository.findByZonaIdZona(idZona).size();
        long disponibles = espacioRepository.countByZonaIdZonaAndEstadoEspacio(idZona, EstadoEspacio.DISPONIBLE);
        long ocupados = espacioRepository.countByZonaIdZonaAndEstadoEspacio(idZona, EstadoEspacio.OCUPADO);
        long enMantenimiento = espacioRepository.countByZonaIdZonaAndEstadoEspacio(idZona, EstadoEspacio.MANTENIMIENTO);
        long inactivos = espacioRepository.countByZonaIdZonaAndEstadoEspacio(idZona, EstadoEspacio.INACTIVO);

        // Calcular porcentaje de ocupación (excluyendo espacios inactivos)
        long espaciosActivos = totalEspacios - inactivos;
        double porcentajeOcupacion = espaciosActivos > 0 
                ? (ocupados * 100.0) / espaciosActivos 
                : 0.0;

        // Determinar si puede desactivarse
        boolean puedeDesactivarse = (ocupados == 0) && (enMantenimiento == 0);

        return EstadisticasZonaDto.builder()
                .idZona(idZona)
                .nombreZona(zona.getNombre())
                .totalEspacios(totalEspacios)
                .espaciosDisponibles(disponibles)
                .espaciosOcupados(ocupados)
                .espaciosEnMantenimiento(enMantenimiento)
                .espaciosInactivos(inactivos)
                .porcentajeOcupacion(Math.round(porcentajeOcupacion * 100.0) / 100.0)
                .puedeDesactivarse(puedeDesactivarse)
                .build();
    }

    /**
     * Genera un código único de 4 caracteres basado en el nombre.
     * Si el código ya existe, agrega un sufijo numérico.
     * Ejemplos:
     *   "Zona A" → "ZONA"
     *   "Zona B" → "ZONB" (si ZONA existe)
     *   "VIP Estacionamiento" → "VIP1" (si VIP ya existe)
     */
    private String generarCodigoUnico(String nombre) {
        // Extraer primeras 4 letras válidas (solo letras y números)
        String nombreLimpio = nombre.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        String codigoBase = nombreLimpio.length() >= 4 
                ? nombreLimpio.substring(0, 4) 
                : nombreLimpio;

        // Si el código base no existe, usarlo directamente
        if (!zonaRepository.existsByCodigo(codigoBase)) {
            return codigoBase;
        }

        // Si existe, intentar con primeras 3 letras + número secuencial
        String prefijo = codigoBase.length() >= 3 
                ? codigoBase.substring(0, 3) 
                : codigoBase;

        // Buscar el siguiente número disponible (1-9)
        for (int i = 1; i <= 9; i++) {
            String codigoCandidato = prefijo + i;
            if (!zonaRepository.existsByCodigo(codigoCandidato)) {
                return codigoCandidato;
            }
        }

        // Si todos están ocupados, usar timestamp de 4 dígitos como fallback
        String timestamp = String.valueOf(System.currentTimeMillis() % 10000);
        return String.format("%04d", Integer.parseInt(timestamp));
    }

    // Método auxiliar para no repetir código al convertir Entidad -> DTO
    private ZonaResponseDto convertirADto(Zona zona) {
        // Contar espacios totales de esta zona
        long totalEspacios = espacioRepository.findByZonaIdZona(zona.getIdZona()).size();

        return ZonaResponseDto.builder()
                .idZona(zona.getIdZona())
                .nombre(zona.getNombre())
                .codigo(zona.getCodigo())
                .descripcion(zona.getDescripcion())
                .estado(zona.getEstado())
                .tipo(zona.getTipo())
                .capacidad(zona.getCapacidad())
                .totalEspacios(totalEspacios)
                .build();
    }
}