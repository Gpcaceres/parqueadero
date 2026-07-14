package ec.edu.espe.zonas.controladores;

import ec.edu.espe.zonas.dtos.EstadisticasZonaDto;
import ec.edu.espe.zonas.dtos.ZonaRequestDto;
import ec.edu.espe.zonas.dtos.ZonaResponseDto;
import ec.edu.espe.zonas.services.ZonaServicio;
import ec.edu.espe.zonas.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/zonas")
@RequiredArgsConstructor
public class ZonaControlador {

    private final ZonaServicio zonaServicio;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<ZonaResponseDto>> listarZonas() {
        return ResponseEntity.ok(zonaServicio.listarZonas());
    }

    @PostMapping
    public ResponseEntity<ZonaResponseDto> crearZona(
            @Valid @RequestBody ZonaRequestDto request,
            HttpServletRequest httpRequest) {
        var usuario = jwtUtil.extraerUsuario(httpRequest);
        return new ResponseEntity<>(
                zonaServicio.crearZona(
                        request,
                        httpRequest.getRemoteAddr(),
                        usuario.map(JwtUtil.AuthenticatedUser::username).orElse(null),
                        usuario.map(JwtUtil.AuthenticatedUser::primerRol).orElse(null)),
                HttpStatus.CREATED);
    }

    @PutMapping("/{idZona}")
    public ResponseEntity<ZonaResponseDto> actualizarZona(
            @PathVariable UUID idZona,
            @Valid @RequestBody ZonaRequestDto request,
            HttpServletRequest httpRequest) {
        var usuario = jwtUtil.extraerUsuario(httpRequest);
        return ResponseEntity.ok(
                zonaServicio.actualizarZona(
                        idZona,
                        request,
                        httpRequest.getRemoteAddr(),
                        usuario.map(JwtUtil.AuthenticatedUser::username).orElse(null),
                        usuario.map(JwtUtil.AuthenticatedUser::primerRol).orElse(null)));
    }

    @PatchMapping("/{idZona}/activar-desactivar")
    public ResponseEntity<Void> activarDesactivar(
            @PathVariable UUID idZona, HttpServletRequest httpRequest) {
        var usuario = jwtUtil.extraerUsuario(httpRequest);
        zonaServicio.activarDesactivar(
                idZona,
                httpRequest.getRemoteAddr(),
                usuario.map(JwtUtil.AuthenticatedUser::username).orElse(null),
                usuario.map(JwtUtil.AuthenticatedUser::primerRol).orElse(null));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{idZona}/estadisticas")
    public ResponseEntity<EstadisticasZonaDto> obtenerEstadisticas(@PathVariable UUID idZona) {
        return ResponseEntity.ok(zonaServicio.obtenerEstadisticas(idZona));
    }
}
