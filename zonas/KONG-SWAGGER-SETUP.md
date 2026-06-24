# Kong API Gateway y Swagger - Guía de Configuración

Este documento explica cómo usar Kong como API Gateway y Swagger para documentación de API en el proyecto Parqueadero.

## 📋 Componentes Agregados

### 1. **SpringDoc OpenAPI (Swagger)**
- **Dependencia**: `springdoc-openapi-starter-webmvc-ui v2.3.0`
- **Función**: Documentación automática de endpoints REST
- **UI**: Disponible en `http://localhost:8080/swagger-ui.html`
- **API Spec**: `http://localhost:8080/v3/api-docs`

### 2. **Kong API Gateway**
- **Versión**: Kong 3.6-alpine
- **Puertos**:
  - `8000`: Proxy API (enrutamiento de solicitudes)
  - `8001`: Admin API (gestión de Kong)
  - `8002`: Kong Manager UI (interfaz de administración)
- **Base de datos**: PostgreSQL para Kong
- **Función**: API Gateway centralizado para enrutamiento y gestión de APIs

### 3. **Base de Datos PostgreSQL**
- **Zonas App**: Puerto 5432 (para la aplicación)
- **Kong**: Puerto 5433 (para el gateway)

---

## 🚀 Inicio Rápido

### Levantar los servicios

```bash
docker-compose up -d
```

Esto levantará:
- PostgreSQL (zonas_postgres en puerto 5432)
- PostgreSQL (kong_postgres en puerto 5433)
- Kong Migration (inicialización)
- Kong Gateway (puerto 8000)
- Kong Manager (puerto 8002)

### Verificar que todo está funcionando

```bash
# Verificar Kong
curl -i http://localhost:8001/status

# Verificar Swagger (cuando la app esté corriendo)
curl http://localhost:8080/swagger-ui.html
```

---

## 🔧 Configuración de Kong

### Opción 1: Configuración Manual vía Admin API

#### Crear un Servicio

```bash
curl -X POST http://localhost:8001/services \
  --data name=zonas-service \
  --data url=http://zonas:8080
```

#### Crear una Ruta

```bash
curl -X POST http://localhost:8001/services/zonas-service/routes \
  --data 'paths[]=/api/zonas' \
  --data strip_path=false
```

#### Crear un Consumidor (opcional)

```bash
curl -X POST http://localhost:8001/consumers \
  --data username=admin
```

#### Agregar autenticación API Key

```bash
curl -X POST http://localhost:8001/consumers/admin/key-auth \
  --data key=my-api-key
```

---

### Opción 2: Configuración Automática

Hay un script `kong-init.sh` que configura automáticamente los servicios. Para usarlo:

```bash
# Hacer el script ejecutable
chmod +x kong-init.sh

# Ejecutar después de que Kong esté listo
./kong-init.sh
```

---

## 🌐 Acceso a los Servicios

### Swagger UI (Documentación de API)
```
http://localhost:8080/swagger-ui.html
```

### Kong Admin API
```
http://localhost:8001
```

### Kong Manager (UI Admin de Kong)
```
http://localhost:8002
```

### API vía Kong (una vez configurado)
```
http://localhost:8000/api/zonas
http://localhost:8000/api/espacios
```

---

## 📝 Ejemplos de Uso

### Sin Kong (directamente a la app)

```bash
# Obtener todas las zonas
curl http://localhost:8080/api/zonas

# Obtener todos los espacios
curl http://localhost:8080/api/espacios
```

### Con Kong (recomendado para producción)

```bash
# Obtener todas las zonas vía Kong
curl http://localhost:8000/api/zonas

# Con API Key (si está habilitada)
curl -H "apikey: my-api-key" http://localhost:8000/api/zonas
```

---

## 🔐 Plugins Útiles de Kong

Kong soporta plugins para características adicionales:

### 1. **Rate Limiting**
```bash
curl -X POST http://localhost:8001/services/zonas-service/plugins \
  --data name=rate-limiting \
  --data config.minute=100
```

### 2. **CORS**
```bash
curl -X POST http://localhost:8001/services/zonas-service/plugins \
  --data name=cors \
  --data config.origins='*'
```

### 3. **Logging**
```bash
curl -X POST http://localhost:8001/services/zonas-service/plugins \
  --data name=file-log \
  --data config.path=/var/log/kong-zonas.log
```

### 4. **Request/Response Transformer**
```bash
curl -X POST http://localhost:8001/services/zonas-service/plugins \
  --data name=request-transformer \
  --data config.add.headers='X-Custom-Header:value'
```

---

## 📊 Monitoreo de Kong

### Ver todas las rutas
```bash
curl http://localhost:8001/routes
```

### Ver todos los servicios
```bash
curl http://localhost:8001/services
```

### Ver estado de Kong
```bash
curl http://localhost:8001/status
```

### Ver logs
```bash
docker logs kong_gateway
```

---

## 🔄 Actualizar la Aplicación

Si haces cambios en el código:

1. Reconstruir la imagen:
```bash
docker-compose down
docker-compose up -d --build
```

2. Reconfigurar Kong si es necesario:
```bash
./kong-init.sh
```

---

## 🧹 Limpiar

### Detener servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes
```bash
docker-compose down -v
```

---

## 📖 Documentación Oficial

- **Kong**: https://docs.konghq.com/
- **SpringDoc OpenAPI**: https://springdoc.org/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## 🐛 Solución de Problemas

### Kong no se conecta a la base de datos
```bash
# Verificar que kong-db esté corriendo
docker-compose ps

# Ver logs
docker logs kong_migration
docker logs kong_gateway
```

### Swagger UI no carga
```bash
# Verificar que la app esté corriendo
curl http://localhost:8080/v3/api-docs

# Ver logs de Spring Boot
docker logs zonas_app
```

### Las rutas no funcionan en Kong
```bash
# Verificar que el servicio y rutas estén creados
curl http://localhost:8001/services
curl http://localhost:8001/routes

# Probar conectividad desde Kong
docker exec kong_gateway curl http://zonas:8080/actuator/health
```

---

## ✅ Checklist de Implementación

- [x] Agregar dependencias de Swagger (pom.xml)
- [x] Configurar Swagger (application.yaml)
- [x] Agregar Kong al docker-compose.yml
- [x] Agregar volúmenes necesarios
- [x] Agregar healthchecks
- [x] Crear script de inicialización de Kong
- [ ] Crear Dockerfile para la aplicación Zonas
- [ ] Agregar endpoints de documentación con anotaciones @Operation
- [ ] Configurar CORS en Kong si es necesario
- [ ] Implementar autenticación en Kong (API Key, JWT, OAuth2)

---

**Última actualización**: 2026-06-24
