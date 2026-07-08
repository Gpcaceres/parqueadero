package ec.edu.espe.zonas.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEvent {
    private String servicio;
    private String accion;
    private String entidad;
    private Object datos;
    private String usuario;
    private String ip;
    private String mac;
}
