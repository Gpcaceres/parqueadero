package ec.edu.espe.zonas.controladores;

import ec.edu.espe.zonas.dtos.EspacioRequestDto;
import ec.edu.espe.zonas.dtos.EspacioResponseDto;
import ec.edu.espe.zonas.services.EspacioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/espacios")
@RequiredArgsConstructor
public class EspacioControlador {

    private final EspacioService espacioService;

    @GetMapping
    public ResponseEntity<List<EspacioResponseDto>> listarEspacios() {
        return ResponseEntity.ok(espacioService.listarEspacios());
    }

    @GetMapping("/{idEspacio}")
    public ResponseEntity<EspacioResponseDto> obtenerEspacioPorId(@PathVariable UUID idEspacio) {
        return ResponseEntity.ok(espacioService.obtenerEspacioPorId(idEspacio));
    }

    @GetMapping("/zona/{idZona}")
    public ResponseEntity<List<EspacioResponseDto>> listarEspaciosPorZona(@PathVariable UUID idZona) {
        return ResponseEntity.ok(espacioService.listarEspaciosPorZona(idZona));
    }

    @GetMapping("/activos")
    public ResponseEntity<List<EspacioResponseDto>> listarEspaciosActivos() {
        return ResponseEntity.ok(espacioService.listarEspaciosActivos());
    }

    @PostMapping
    public ResponseEntity<EspacioResponseDto> crearEspacio(
            @Valid @RequestBody EspacioRequestDto request,
            HttpServletRequest httpRequest) {
        return new ResponseEntity<>(
                espacioService.crearEspacio(request, httpRequest.getRemoteAddr()), HttpStatus.CREATED);
    }

    @PutMapping("/{idEspacio}")
    public ResponseEntity<EspacioResponseDto> actualizarEspacio(
            @PathVariable UUID idEspacio,
            @Valid @RequestBody EspacioRequestDto request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(
                espacioService.actualizarEspacio(idEspacio, request, httpRequest.getRemoteAddr()));
    }

    @PatchMapping("/{idEspacio}/activar-desactivar")
    public ResponseEntity<Void> activarDesactivar(
            @PathVariable UUID idEspacio, HttpServletRequest httpRequest) {
        espacioService.activarDesactivar(idEspacio, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
