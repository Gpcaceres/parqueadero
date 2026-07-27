package ec.edu.espe.zonas.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoEspacio;
import ec.edu.espe.zonas.entidades.TipoZona;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.exceptions.CapacidadExcedidaException;
import ec.edu.espe.zonas.exceptions.RecursoNoEncontradoException;
import ec.edu.espe.zonas.repositorios.EspacioRepository;
import ec.edu.espe.zonas.repositorios.ZonaRepository;
import ec.edu.espe.zonas.services.impl.EspacioServicioImpl;
import ec.edu.espe.zonas.utils.UtilsMappers;

/**
 * Pruebas unitarias de EspacioServicioImpl -- antes de este archivo, "zonas"
 * solo tenia el smoke test de contexto (ZonasApplicationTests), sin ninguna
 * prueba de reglas de negocio reales (validacion de capacidad, generacion de
 * codigo unico, toggle activar/desactivar).
 */
@ExtendWith(MockitoExtension.class)
class EspacioServicioImplTest {

    @Mock
    private EspacioRepository repositorioEspacio;

    @Mock
    private ZonaRepository zonaRepository;

    @Mock
    private AuditEventPublisher auditEventPublisher;

    private UtilsMappers mapper;

    private EspacioServicioImpl service;

    private Zona zona;

    @BeforeEach
    void setUp() {
        mapper = new UtilsMappers();
        service = new EspacioServicioImpl(repositorioEspacio, zonaRepository, mapper, auditEventPublisher);

        zona = Zona.builder()
                .idZona(UUID.randomUUID())
                .nombre("Zona Norte")
                .codigo("ZN")
                .estado(1)
                .capacidad(2)
                .tipo(TipoZona.REGULAR)
                .build();
    }

    @Test
    void crearEspacio_debeLanzarCapacidadExcedida_siLaZonaYaAlcanzoElLimite() {
        EspacioRequestDto dto = EspacioRequestDto.builder()
                .idZona(zona.getIdZona())
                .tipo(TipoEspacio.CARRO)
                .build();

        when(zonaRepository.findById(zona.getIdZona())).thenReturn(Optional.of(zona));
        // La zona ya tiene 2 espacios y su capacidad es 2 -> no debe permitir un tercero.
        when(repositorioEspacio.findByZonaIdZona(zona.getIdZona()))
                .thenReturn(List.of(new Espacio(), new Espacio()));

        assertThatThrownBy(() -> service.crearEspacio(dto, "127.0.0.1", "admin", "admin"))
                .isInstanceOf(CapacidadExcedidaException.class);

        verify(repositorioEspacio, never()).save(any());
        verify(auditEventPublisher, never()).publicar(any(), any(), any(), any(), any(), any());
    }

    @Test
    void crearEspacio_debeGenerarCodigoSecuencialYPublicarAuditoria_siHayCupo() {
        EspacioRequestDto dto = EspacioRequestDto.builder()
                .idZona(zona.getIdZona())
                .tipo(TipoEspacio.CARRO)
                .build();

        when(zonaRepository.findById(zona.getIdZona())).thenReturn(Optional.of(zona));
        when(repositorioEspacio.findByZonaIdZona(zona.getIdZona())).thenReturn(List.of());
        // "ZN-1" aun no existe -- debe usarse tal cual, sin buscar "ZN-2".
        when(repositorioEspacio.existsByCodigo("ZN-1")).thenReturn(false);
        when(repositorioEspacio.save(any(Espacio.class))).thenAnswer(inv -> inv.getArgument(0));

        EspacioResponseDto resultado = service.crearEspacio(dto, "127.0.0.1", "admin", "admin");

        assertThat(resultado.getCodigo()).isEqualTo("ZN-1");
        assertThat(resultado.getEstadoEspacio()).isEqualTo(EstadoEspacio.DISPONIBLE);
        verify(auditEventPublisher, times(1))
                .publicar("CREATE", "ESPACIO", resultado, "127.0.0.1", "admin", "admin");
    }

    @Test
    void crearEspacio_debeSaltarCodigosYaUsados_hastaEncontrarUnoLibre() {
        EspacioRequestDto dto = EspacioRequestDto.builder()
                .idZona(zona.getIdZona())
                .tipo(TipoEspacio.MOTO)
                .build();

        when(zonaRepository.findById(zona.getIdZona())).thenReturn(Optional.of(zona));
        when(repositorioEspacio.findByZonaIdZona(zona.getIdZona())).thenReturn(List.of());
        when(repositorioEspacio.existsByCodigo("ZN-1")).thenReturn(true);
        when(repositorioEspacio.existsByCodigo("ZN-2")).thenReturn(true);
        when(repositorioEspacio.existsByCodigo("ZN-3")).thenReturn(false);
        when(repositorioEspacio.save(any(Espacio.class))).thenAnswer(inv -> inv.getArgument(0));

        EspacioResponseDto resultado = service.crearEspacio(dto, "127.0.0.1", "admin", "admin");

        assertThat(resultado.getCodigo()).isEqualTo("ZN-3");
    }

    @Test
    void crearEspacio_debeLanzarRecursoNoEncontrado_siLaZonaNoExiste() {
        UUID idZonaInexistente = UUID.randomUUID();
        EspacioRequestDto dto = EspacioRequestDto.builder()
                .idZona(idZonaInexistente)
                .tipo(TipoEspacio.CARRO)
                .build();

        when(zonaRepository.findById(idZonaInexistente)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.crearEspacio(dto, "127.0.0.1", "admin", "admin"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void activarDesactivar_debePasarDeDisponibleAInactivo() {
        Espacio espacio = Espacio.builder()
                .idEspacio(UUID.randomUUID())
                .codigo("ZN-1")
                .tipo(TipoEspacio.CARRO)
                .estadoEspacio(EstadoEspacio.DISPONIBLE)
                .zona(zona)
                .build();

        when(repositorioEspacio.findById(espacio.getIdEspacio())).thenReturn(Optional.of(espacio));
        when(repositorioEspacio.save(any(Espacio.class))).thenAnswer(inv -> inv.getArgument(0));

        service.activarDesactivar(espacio.getIdEspacio(), "127.0.0.1", "admin", "admin");

        assertThat(espacio.getEstadoEspacio()).isEqualTo(EstadoEspacio.INACTIVO);
    }

    @Test
    void activarDesactivar_debePasarDeInactivoADisponible() {
        Espacio espacio = Espacio.builder()
                .idEspacio(UUID.randomUUID())
                .codigo("ZN-1")
                .tipo(TipoEspacio.CARRO)
                .estadoEspacio(EstadoEspacio.INACTIVO)
                .zona(zona)
                .build();

        when(repositorioEspacio.findById(espacio.getIdEspacio())).thenReturn(Optional.of(espacio));
        when(repositorioEspacio.save(any(Espacio.class))).thenAnswer(inv -> inv.getArgument(0));

        service.activarDesactivar(espacio.getIdEspacio(), "127.0.0.1", "admin", "admin");

        assertThat(espacio.getEstadoEspacio()).isEqualTo(EstadoEspacio.DISPONIBLE);
    }
}
