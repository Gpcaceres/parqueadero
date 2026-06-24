# 🚀 Kong API Gateway - Parqueadero

Gateway centralizado e independiente para enrutar y gestionar múltiples microservicios del proyecto Parqueadero.

## 📋 Características

- ✅ **API Gateway centralizado** - Punto único de entrada para todos los microservicios
- ✅ **Independiente de los microservicios** - No requiere cambios en el código de los servicios
- ✅ **Configurable dinámicamente** - Registra nuevos servicios sin reiniciar Kong
- ✅ **Plugins incluidos** - CORS, Rate Limiting, Logging, Request Transformation
- ✅ **Autenticación** - API Key, JWT, OAuth2 (extensible)
- ✅ **Monitoreo** - Admin API y UI de gestión
- ✅ **Base de datos independiente** - PostgreSQL dedicada para Kong

## 📁 Estructura

```
kong-gateway/
├── docker-compose.yml      # Orquestación de Kong + PostgreSQL
├── kong.yml               # Configuración declarativa (ejemplo)
├── configure-kong.sh      # Script para cargar la configuración
├── register-service.sh    # Script para registrar nuevos servicios
├── health-check.sh        # Script para verificar estado
├── Dockerfile             # (Opcional) Para personalizar Kong
└── README.md             # Este archivo
```

## 🚀 Inicio Rápido

### 1. Levantar Kong

```bash
cd kong-gateway
docker-compose up -d
```

Verifica que está corriendo:
```bash
docker-compose ps
```

### 2. Verificar que Kong está listo

```bash
curl http://localhost:8001/status | jq .
```

Espera a que aparezca `"status": 0` (puede tomar 30 segundos).

### 3. Registrar un microservicio

**Opción A: Registrar Zonas (Spring Boot en puerto 8080)**

```bash
chmod +x register-service.sh
./register-service.sh zonas http://host.docker.internal:8080 \
  /api/zonas \
  /api/espacios \
  /api/zonas/swagger-ui.html \
  /api/zonas/v3/api-docs
```

**Opción B: Registrar Vehículos (NestJS en puerto 3000)**

```bash
./register-service.sh vehiculos http://host.docker.internal:3000 \
  /api/vehiculos \
  /api/marcas \
  /api/modelos
```

**Opción C: Registrar Personas (en puerto 3001)**

```bash
./register-service.sh personas http://host.docker.internal:3001 \
  /api/personas \
  /api/usuarios \
  /api/roles
```

### 4. Verificar que funciona

```bash
# Acceder a través de Kong
curl http://localhost:8000/api/zonas

# Ver servicios registrados
curl http://localhost:8001/services | jq .

# Ver rutas registradas
curl http://localhost:8001/routes | jq .
```

## 🔌 Puertos

| Servicio | Puerto | Propósito |
|----------|--------|-----------|
| Kong Proxy | 8000 | Solicitudes de clientes |
| Kong Admin | 8001 | Gestión via API |
| Kong Manager | 8002 | UI de administración |
| PostgreSQL | 5433 | BD de Kong |

## 📊 Interfaces de Administración

### Kong Manager (UI Web)
```
http://localhost:8002
```

Interfaz gráfica para:
- Ver servicios y rutas
- Configurar plugins
- Gestionar consumidores
- Monitoreo en tiempo real

### Kong Admin API (CLI/REST)

```bash
# Ver servicios
curl http://localhost:8001/services | jq

# Ver una ruta
curl http://localhost:8001/services/zonas/routes | jq

# Ver plugins
curl http://localhost:8001/services/zonas/plugins | jq

# Ver consumidores
curl http://localhost:8001/consumers | jq

# Ver credenciales
curl http://localhost:8001/consumers/admin/key-auth | jq
```

## 🔧 Registrar un Servicio

### Método 1: Script (Recomendado)

```bash
./register-service.sh <nombre> <url> <ruta1> [ruta2] [ruta3] ...
```

**Ejemplo:**
```bash
./register-service.sh myservice http://localhost:5000 /api/users /api/posts
```

Esto:
1. Crea el servicio en Kong
2. Crea una ruta con los paths especificados
3. Agrega plugins de CORS y Rate Limiting

### Método 2: Admin API (Manual)

**Crear servicio:**
```bash
curl -X POST http://localhost:8001/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "myservice",
    "url": "http://localhost:5000",
    "tags": ["parqueadero", "myservice"]
  }'
```

**Crear ruta:**
```bash
curl -X POST http://localhost:8001/services/myservice/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "myservice-routes",
    "paths": ["/api/users", "/api/posts"],
    "strip_path": false
  }'
```

**Agregar plugin CORS:**
```bash
curl -X POST http://localhost:8001/services/myservice/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cors",
    "config": {
      "origins": ["*"],
      "credentials": true,
      "max_age": 3600
    }
  }'
```

### Método 3: Archivo de Configuración (kong.yml)

Edita `kong.yml` y agrega tu servicio en la sección `services`:

```yaml
services:
  - name: myservice
    url: http://localhost:5000
    routes:
      - name: myservice-routes
        paths:
          - /api/users
          - /api/posts
        strip_path: false
    plugins:
      - name: cors
        config:
          origins: ["*"]
```

Luego carga la configuración:
```bash
./configure-kong.sh
```

## 🔐 Autenticación

### Crear un Consumidor con API Key

```bash
# Crear consumidor
curl -X POST http://localhost:8001/consumers \
  -d username=mi-usuario

# Agregar API Key
curl -X POST http://localhost:8001/consumers/mi-usuario/key-auth \
  -d key=mi-clave-secreta-12345

# Usar la API Key
curl -H "apikey: mi-clave-secreta-12345" http://localhost:8000/api/zonas
```

### Habilitar autenticación en una ruta

```bash
# Agregar plugin key-auth a un servicio
curl -X POST http://localhost:8001/services/zonas/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "key-auth",
    "config": {
      "key_in_header": true,
      "key_in_body": false
    }
  }'
```

## 📈 Rate Limiting

Configurado por defecto a **100 solicitudes por minuto** por servicio.

Para cambiar:
```bash
# Obtener ID del plugin
curl http://localhost:8001/services/zonas/plugins | jq '.data[] | select(.name=="rate-limiting") | .id'

# Actualizar límite (1000 solicitudes por minuto)
curl -X PATCH http://localhost:8001/plugins/<plugin-id> \
  -d config.minute=1000
```

## 🧪 Test de Conectividad

Usa el script incluido:
```bash
chmod +x health-check.sh
./health-check.sh
```

O manualmente:
```bash
# Verificar Kong
curl http://localhost:8001/status | jq '.status'

# Verificar cada servicio
curl http://localhost:8000/api/zonas
curl http://localhost:8000/api/vehiculos
curl http://localhost:8000/api/personas
```

## 📚 Plugins Disponibles

Kong soporta muchos plugins. Los incluidos por defecto:

| Plugin | Uso |
|--------|-----|
| **cors** | Control de CORS cross-origin |
| **rate-limiting** | Límite de solicitudes |
| **key-auth** | Autenticación por API Key |
| **response-transformer** | Modificar respuestas |
| **request-transformer** | Modificar solicitudes |
| **file-log** | Logging a archivo |
| **request-size-limiting** | Límite de tamaño |
| **jwt** | Autenticación JWT |
| **oauth2** | Autenticación OAuth2 |

Para agregar un plugin:
```bash
curl -X POST http://localhost:8001/services/<service-id>/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<plugin-name>",
    "config": {
      "key": "value"
    }
  }'
```

## 🔄 Actualizar un Servicio

```bash
# Actualizar URL del servicio
curl -X PATCH http://localhost:8001/services/zonas \
  -d url=http://host.docker.internal:8081

# Actualizar rutas
curl -X PATCH http://localhost:8001/routes/zonas-routes \
  -d 'paths[]=/api/new-path'
```

## 🗑️ Eliminar un Servicio

```bash
# Las rutas y plugins se eliminan automáticamente
curl -X DELETE http://localhost:8001/services/zonas
```

## 🐛 Solución de Problemas

### Kong no se conecta a la BD

```bash
# Verificar que kong-db está corriendo
docker-compose ps

# Ver logs
docker-compose logs kong-migration
docker-compose logs kong
```

### Servicio no accesible

```bash
# Verificar que Kong puede alcanzar el servicio
docker exec kong_api_gateway curl http://host.docker.internal:8080/health

# Ver logs de Kong
docker-compose logs kong
```

### "Connection refused" desde Kong

Si Kong no puede alcanzar tu servicio localmente:
- En **Linux**: Usar `localhost` en lugar de `host.docker.internal`
- En **Docker Desktop (Mac/Windows)**: Usar `host.docker.internal`
- En **Docker en VM**: Usar la IP de la VM

### Rate limit muy restrictivo

```bash
# Aumentar a 1000 por minuto
curl -X PATCH http://localhost:8001/plugins/<plugin-id> \
  -d config.minute=1000
```

## 📖 Documentación Externa

- [Kong Official Docs](https://docs.konghq.com/)
- [Kong Admin API](https://docs.konghq.com/3.6/admin-api/)
- [Kong Plugins](https://docs.konghq.com/hub/)

## ✅ Checklist de Implementación

- [ ] Kong levantado: `docker-compose ps`
- [ ] Kong disponible: `curl http://localhost:8001/status`
- [ ] Servicios registrados: `curl http://localhost:8001/services`
- [ ] Rutas funcionando: `curl http://localhost:8000/api/<servicio>`
- [ ] Kong Manager accesible: http://localhost:8002
- [ ] CORS habilitado
- [ ] Rate limiting configurado
- [ ] Consumidores creados
- [ ] API Keys asignadas

## 🧹 Limpiar

```bash
# Detener Kong
docker-compose down

# Eliminar volúmenes (BD incluida)
docker-compose down -v

# Eliminar todo (contenedores, imágenes, volúmenes)
docker-compose down -v --rmi all
```

## 💡 Casos de Uso

### Agregar un nuevo microservicio

1. Asegúrate que el servicio está corriendo en un puerto disponible
2. Ejecuta: `./register-service.sh <nombre> <url> <rutas...>`
3. Verifica: `curl http://localhost:8000/<ruta>`

### Cambiar URL de un servicio (migración)

```bash
curl -X PATCH http://localhost:8001/services/mi-servicio \
  -d url=http://nueva-url:puerto
```

### Habilitar autenticación global

```bash
# Crear consumidor
curl -X POST http://localhost:8001/consumers -d username=app

# Agregar API Key
curl -X POST http://localhost:8001/consumers/app/key-auth -d key=secret123

# Habilitar auth en servicio
curl -X POST http://localhost:8001/services/mi-servicio/plugins \
  -d name=key-auth
```

---

**Última actualización**: 2026-06-24

Para preguntas o problemas, consulta la [documentación oficial de Kong](https://docs.konghq.com/).
