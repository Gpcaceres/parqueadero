package ec.edu.espe.zonas.services;

import ec.edu.espe.zonas.events.AuditEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;

/**
 * Publica eventos de auditoría hacia ms-audit (vía RabbitMQ), en paralelo
 * al resto de la lógica de negocio de este servicio.
 */
@Service
@Slf4j
public class AuditEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${audit.rabbitmq.exchange:audit_exchange}")
    private String exchange;

    @Value("${audit.rabbitmq.routing-key:audit.event}")
    private String routingKey;

    private String cachedMac;

    public AuditEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publicar(String accion, String entidad, Object datos, String ip) {
        AuditEvent event = AuditEvent.builder()
                .servicio("ms-zonas")
                .accion(accion)
                .entidad(entidad)
                .datos(datos)
                .ip(ip)
                .mac(obtenerMacLocal())
                .build();

        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, event);
            log.debug("Evento publicado: {} en ms-zonas", accion);
        } catch (Exception e) {
            log.warn("No se pudo publicar el evento de auditoría: {}", e.getMessage());
        }
    }

    // Dirección MAC de la interfaz de red del propio contenedor/host que
    // ejecuta el servicio. Un cliente HTTP nunca expone su MAC al servidor
    // (se pierde al primer salto de red), así que lo único obtenible de
    // forma honesta es la MAC de quien procesa y emite el evento.
    private String obtenerMacLocal() {
        if (cachedMac != null) {
            return cachedMac;
        }
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) {
                    continue;
                }
                byte[] mac = iface.getHardwareAddress();
                if (mac != null) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < mac.length; i++) {
                        sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? ":" : ""));
                    }
                    cachedMac = sb.toString();
                    return cachedMac;
                }
            }
        } catch (SocketException e) {
            log.warn("No se pudo obtener la MAC local: {}", e.getMessage());
        }
        cachedMac = "00:00:00:00:00:00";
        return cachedMac;
    }
}
