package ec.edu.espe.zonas.filters;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

import ec.edu.espe.zonas.utils.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * A diferencia de JwtUtil.extraerUsuario() (que solo decodifica el token si
 * viene, para poblar la auditoría, pero nunca rechaza), este filtro sí
 * bloquea: exige un JWT válido con rol admin/root/recaudador para cualquier
 * método que mute zonas o espacios (POST/PUT/PATCH/DELETE). Las lecturas
 * (GET) quedan abiertas, igual que en el resto del sistema (las consume el
 * dashboard público sin login).
 */
@Component
public class WriteAuthorizationFilter extends OncePerRequestFilter {

    private static final Set<String> WRITE_ROLES = Set.of("admin", "root", "recaudador");
    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final String[] PROTECTED_PATH_PREFIXES = { "/api/v1/zonas", "/api/v1/espacios" };

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WriteAuthorizationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!requiresAuthorization(request)) {
            chain.doFilter(request, response);
            return;
        }

        var usuario = jwtUtil.extraerUsuario(request);
        if (usuario.isEmpty()) {
            respondError(response, HttpServletResponse.SC_UNAUTHORIZED, "Se requiere un token de autenticación");
            return;
        }

        List<String> roles = usuario.get().roles();
        boolean autorizado = roles != null && roles.stream().anyMatch(WRITE_ROLES::contains);
        if (!autorizado) {
            respondError(response, HttpServletResponse.SC_FORBIDDEN,
                    "Se requiere uno de estos roles: " + String.join(", ", WRITE_ROLES));
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean requiresAuthorization(HttpServletRequest request) {
        if (!WRITE_METHODS.contains(request.getMethod())) {
            return false;
        }
        String path = request.getRequestURI();
        for (String prefix : PROTECTED_PATH_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private void respondError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status,
                "error", status == HttpServletResponse.SC_UNAUTHORIZED ? "Unauthorized" : "Forbidden",
                "message", message)));
    }
}
