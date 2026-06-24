# 🚀 Kong Gateway - Configuración Completa para Parqueadero

Guía para integrar Kong como API Gateway centralizado e independiente para todos los microservicios del proyecto Parqueadero.

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Clientes Externos                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ (Puerto 8000)
                    ┌─────────────────┐
                    │ Kong Proxy      │
                    │ API Gateway     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────────┐      ┌────────────┐      ┌────────────┐
    │   Zonas    │      │ Vehículos  │      │ Personas   │
    │ (8080)     │      │ (3000)     │      │ (3001)     │
    └────────────┘      └────────────┘      └────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────────────────────────────────────────────────┐
    │           PostgreSQL Compartida                     │
    │           (Puerto 5432)                            │
    └────────────────────────────────────────────────────┘

Kong tiene su propia BD: PostgreSQL (Puerto 5433)
```

## 📁 Estructura del Proyecto

```
Parqueadero/
├── kong-gateway/                 ← Gateway (NUEVO)
│   ├── docker-compose.yml        ← Kong + su BD
│   ├── kong.yml                  ← Configuración declarativa
│   ├── register-service.sh       ← Script para registrar servicios
│   ├── configure-kong.sh         ← Script para cargar config
│   ├── health-check.sh           ← Verificar estado
│   ├── .env.example              ← Variables de entorno
│   └── README.md                 ← Documentación completa
│
├── zonas/                         ← Microservicio (sin cambios)
│   ├── docker-compose.yml        ← Solo BD PostgreSQL
│   ├── pom.xml
│   ├── Dockerfile
│   └── ...
│
├── vehiculos/                     ← Microservicio (sin cambios)
│   ├── docker-compose.yml        ← Si lo necesita
│   └── ...
│
├── personas/                      ← Microservicio (sin cambios)
│   └── ...
│
└── docker-compose.yml             ← Archivo raíz (orquesta todo)
```

## 🚀 Instalación Paso a Paso

### Paso 1: Levantar Kong Gateway

```bash
cd kong-gateway
docker-compose up -d
```

Verifica:
```bash
docker-compose ps
chmod +x *.sh
```

Espera a que Kong esté listo (30 segundos aprox):
```bash
curl http://localhost:8001/status
```

### Paso 2: Levantar Microservicios

En carpetas separadas:

```bash
# Terminal 1: Zonas
cd zonas
docker-compose up -d

# Terminal 2: Vehículos (si está containerizado)
cd vehiculos
npm install && npm start

# Terminal 3: Personas (si está containerizado)
cd personas
npm install && npm start
```

### Paso 3: Registrar Servicios en Kong

**Registrar Zonas:**
```bash
cd kong-gateway
./register-service.sh zonas http://host.docker.internal:8080 \
  /api/zonas \
  /api/espacios \
  /api/zonas/swagger-ui.html \
  /api/zonas/v3/api-docs
```

**Registrar Vehículos:**
```bash
./register-service.sh vehiculos http://host.docker.internal:3000 \
  /api/vehiculos \
  /api/marcas \
  /api/modelos
```

**Registrar Personas:**
```bash
./register-service.sh personas http://host.docker.internal:3001 \
  /api/personas \
  /api/usuarios \
  /api/roles
```

### Paso 4: Verificar Configuración

```bash
./health-check.sh
```

Debe mostrar:
- ✓ Kong Admin API
- ✓ Kong Proxy
- Servicios registrados
- Rutas registradas

## 📡 URLs de Acceso

### Acceso Directo (sin Kong)

| Servicio | URL |
|----------|-----|
| Zonas | http://localhost:8080 |
| Vehículos | http://localhost:3000 |
| Personas | http://localhost:3001 |
| Swagger Zonas | http://localhost:8080/swagger-ui.html |

### A Través de Kong (Recomendado)

| Servicio | URL |
|----------|-----|
| Zonas | http://localhost:8000/api/zonas |
| Vehículos | http://localhost:8000/api/vehiculos |
| Personas | http://localhost:8000/api/personas |
| Swagger Zonas | http://localhost:8000/api/zonas/swagger-ui.html |

### Administración

| Herramienta | URL |
|-------------|-----|
| Kong Manager (UI) | http://localhost:8002 |
| Kong Admin API | http://localhost:8001 |
| Endpoint de status | http://localhost:8001/status |

## 🔧 Casos de Uso Comunes

### Agregar un nuevo microservicio

1. Asegúrate que corre en un puerto disponible
2. Registra en Kong:
   ```bash
   cd kong-gateway
   ./register-service.sh mi-servicio http://host.docker.internal:PUERTO /api/paths...
   ```
3. Accede vía: `http://localhost:8000/api/paths...`

### Cambiar URL de un servicio (migración, actualización)

```bash
curl -X PATCH http://localhost:8001/services/zonas \
  -d url=http://nueva-url:puerto
```

### Agregar autenticación con API Key

```bash
cd kong-gateway

# Crear usuario
curl -X POST http://localhost:8001/consumers -d username=app1

# Agregar API Key
curl -X POST http://localhost:8001/consumers/app1/key-auth \
  -d key=secret-key-app1

# Habilitar auth en servicio
curl -X POST http://localhost:8001/services/zonas/plugins \
  -H "Content-Type: application/json" \
  -d '{"name": "key-auth"}'

# Usar con API Key
curl -H "apikey: secret-key-app1" http://localhost:8000/api/zonas
```

### Aumentar Rate Limit

Default: 100 solicitudes/minuto

```bash
# Ver plugins del servicio
curl http://localhost:8001/services/zonas/plugins | jq '.data[] | select(.name=="rate-limiting") | .id'

# Actualizar límite
curl -X PATCH http://localhost:8001/plugins/PLUGIN_ID \
  -d config.minute=10000
```

### Habilitar CORS personalizado

```bash
curl -X PATCH http://localhost:8001/plugins/CORS_PLUGIN_ID \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "origins": ["https://tudominio.com", "https://www.tudominio.com"],
      "credentials": true
    }
  }'
```

## 📊 Monitoreo

### Ver servicios
```bash
curl http://localhost:8001/services | jq '.data[] | {name, url, routes}'
```

### Ver rutas
```bash
curl http://localhost:8001/routes | jq '.data[] | {name, paths, service}'
```

### Ver plugins
```bash
curl http://localhost:8001/plugins | jq '.data[] | {name, service, config}'
```

### Ver consumidores
```bash
curl http://localhost:8001/consumers | jq '.data[] | .username'
```

### Ver credenciales
```bash
curl http://localhost:8001/consumers/app1/key-auth | jq '.data[] | .key'
```

### Logs en tiempo real

```bash
# Logs de Kong
docker logs -f kong_api_gateway

# Logs de BD de Kong
docker logs -f kong_db
```

## 🐛 Solución de Problemas

### Kong no se conecta a la BD

```bash
# Verificar contenedores
docker-compose ps

# Ver logs
docker-compose logs kong-migration
docker-compose logs kong

# Reiniciar
docker-compose down -v
docker-compose up -d
```

### Servicio no accesible desde Kong

**Problema:** `Connection refused` cuando intento `curl http://localhost:8000/api/zonas`

**Soluciones:**

1. **Verificar que el servicio está corriendo:**
   ```bash
   curl http://localhost:8080  # Zonas directamente
   ```

2. **Verificar que Kong ve el servicio:**
   ```bash
   docker exec kong_api_gateway curl http://host.docker.internal:8080
   ```

3. **En Linux, usar `localhost` en lugar de `host.docker.internal`:**
   ```bash
   ./register-service.sh zonas http://localhost:8080 /api/zonas
   ```

4. **Verificar que la ruta está registrada:**
   ```bash
   curl http://localhost:8001/routes | jq '.data[] | .name'
   ```

### Port already in use

Si un puerto está ocupado:

```bash
# Encontrar qué usa el puerto
lsof -i :8000

# O cambiar el puerto en docker-compose.yml
# Cambiar "8000:8000" por "8010:8000"
```

### Swagger UI devuelve 404

```bash
# Verificar que la ruta existe
curl http://localhost:8001/routes | jq '.data[] | select(.name=="zonas-swagger")'

# Registra nuevamente
./register-service.sh zonas http://host.docker.internal:8080 \
  /api/zonas \
  /api/zonas/swagger-ui.html \
  /api/zonas/v3/api-docs
```

## 🔄 Actualizar Kong

```bash
# Actualizar imagen de Kong
docker pull kong:3.6-alpine

# Reiniciar
docker-compose down
docker-compose up -d
```

## ✅ Checklist de Implementación

- [ ] Kong levantado: `docker-compose ps`
- [ ] Kong disponible: `curl http://localhost:8001/status`
- [ ] Zonas registrado: `./register-service.sh zonas ...`
- [ ] Zonas accesible: `curl http://localhost:8000/api/zonas`
- [ ] Vehículos registrado: `./register-service.sh vehiculos ...`
- [ ] Vehículos accesible: `curl http://localhost:8000/api/vehiculos`
- [ ] Personas registrado: `./register-service.sh personas ...`
- [ ] Personas accesible: `curl http://localhost:8000/api/personas`
- [ ] Kong Manager funciona: http://localhost:8002
- [ ] Rate limiting habilitado
- [ ] CORS configurado
- [ ] Health check pasa: `./health-check.sh`

## 📖 Documentación Adicional

Ver `kong-gateway/README.md` para:
- Guía completa de plugins
- Autenticación avanzada (JWT, OAuth2)
- Configuración declarativa con kong.yml
- Administración desde CLI y UI

## 🧹 Limpiar

```bash
# Detener Kong
cd kong-gateway
docker-compose down

# Eliminar datos (BD incluida)
docker-compose down -v

# Detener todos los servicios
cd ../zonas && docker-compose down
cd ../vehiculos && npm stop  # Si está corriendo localmente
```

## 💡 Notas Importantes

1. **Kong es independiente** - No modifica el código de los microservicios
2. **Flexible** - Agrega/quita servicios sin reiniciar Kong
3. **Escalable** - Puede manejar miles de solicitudes por segundo
4. **BD separada** - Kong usa su propia PostgreSQL (puerto 5433)
5. **Overhead mínimo** - Solo agrega ~1-2ms de latencia

## 🎯 Próximos Pasos

1. Implementar autenticación JWT en Kong
2. Agregar rate limiting por usuario
3. Configurar logging centralizado
4. Monitoreo en Prometheus/Grafana
5. CI/CD para actualizar configuración automáticamente

---

**Última actualización**: 2026-06-24

Para más información, consulta [Kong Documentation](https://docs.konghq.com/).
