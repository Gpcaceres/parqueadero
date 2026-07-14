package ec.edu.espe.zonas.utils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Verifica (opcionalmente) el JWT emitido por ms-personas si viene en el
 * header Authorization. NUNCA rechaza la petición: si no hay token, o es
 * inválido/expirado, se devuelve Optional.empty() y el endpoint sigue
 * funcionando como hoy (sin autenticación). Esto permite saber "quién"
 * realizó cada acción cuando sí se manda un token, para poblar la
 * auditoría, sin romper los clientes que aún no envían Authorization.
 */
@Component
public class JwtUtil {

    @Value("${JWT_SECRET:your-secret-key-change-this}")
    private String secret;

    public record AuthenticatedUser(String idUser, String username, List<String> roles) {
        public String primerRol() {
            return (roles == null || roles.isEmpty()) ? null : roles.get(0);
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<AuthenticatedUser> extraerUsuario(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String token = header.substring(7);
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            String username = claims.get("username", String.class);
            List<String> roles = claims.get("roles", List.class);
            return Optional.of(new AuthenticatedUser(claims.getSubject(), username, roles));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
