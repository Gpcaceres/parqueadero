# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copiar archivos de configuración de Maven
COPY pom.xml .
COPY .mvn .mvn

# Descargar dependencias
RUN mvn dependency:resolve

# Copiar código fuente
COPY src src

# Compilar y empaquetar
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar JAR del stage anterior
COPY --from=builder /app/target/zonas-*.jar app.jar

# Crear usuario no-root
RUN addgroup -S appuser && adduser -S appuser -G appuser
USER appuser

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Comando para ejecutar
ENTRYPOINT ["java", "-jar", "app.jar"]
