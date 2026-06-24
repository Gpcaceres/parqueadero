# 🐳 Docker Compose - Guía Completa

Guía para levantar todos los microservicios del proyecto Parqueadero con Docker Compose.

---

## 📋 Servicios Incluidos

El `docker-compose.yml` raíz levanta:

1. **Kong Gateway** (8000, 8001, 8002)
2. **Asignación y Trazabilidad** (3002)
3. **Vehículos** (3000)
4. **Personas** (3001)
5. **Zonas** (8080)
6. **PostgreSQL Compartida** (5432)
7. **Kong Database** (5433)

---

## 🚀 Inicio Rápido

### Levantamiento de Todos los Servicios

```bash
cd C:\Users\patri\OneDrive\Escritorio\Parqueadero

# Construir imágenes y levantar servicios
docker-compose up -d --build

# Esperar 30-60 segundos a que se inicialicen
```

### Verificar Estado

```bash
# Ver estado de todos los servicios
docker-compose ps

# Debe mostrar todos en estado "Up"
# CONTAINER ID   IMAGE           STATUS
# ...             kong:3.6        Up (healthy)
# ...             node:20         Up (healthy)
# ...             java            Up (healthy)
# ...             postgres:16     Up (healthy)
```

### Ver Logs

```bash
# Todos los servicios
docker-compose logs -f

# Específico
docker-compose logs -f asignacion-trazabilidad
docker-compose logs -f kong
docker-compose logs -f zonas
```

---

## 🌐 Acceso a Servicios

### Kong Gateway
```
Proxy: http://localhost:8000
Admin API: http://localhost:8001
Manager UI: http://localhost:8002
```

### Microservicios
```
Asignación y Trazabilidad: http://localhost:3002/swagger
Vehículos: http://localhost:3000/swagger
Personas: http://localhost:3001/swagger
Zonas: http://localhost:8080/swagger-ui.html
```

### Bases de Datos
```
PostgreSQL General: localhost:5432
  - Usuario: postgres
  - Contraseña: postgres

Kong Database: localhost:5433
  - Usuario: kong
  - Contraseña: kong123
```

---

## 🔧 Comandos Útiles

### Construir sin Levantar

```bash
docker-compose build
```

### Levantar sin Rebuild

```bash
docker-compose up -d
```

### Pausar Servicios

```bash
docker-compose pause
```

### Reanudar Servicios

```bash
docker-compose unpause
```

### Detener Servicios

```bash
docker-compose stop
```

### Eliminar Todo

```bash
# Eliminar contenedores pero mantener volúmenes
docker-compose down

# Eliminar TODO incluyendo volúmenes (cuidado - borra datos)
docker-compose down -v
```

### Ver Logs de un Servicio

```bash
# Asignación (últimas 100 líneas)
docker-compose logs -f asignacion-trazabilidad --tail 100

# Kong
docker-compose logs -f kong

# Zonas
docker-compose logs -f zonas
```

### Ejecutar Comando en Contenedor

```bash
# Ejecutar bash en asignacion-trazabilidad
docker-compose exec asignacion-trazabilidad /bin/sh

# Ejecutar npm test
docker-compose exec asignacion-trazabilidad npm run test

# Ejecutar SQL en PostgreSQL
docker-compose exec postgres psql -U postgres -c "SELECT * FROM assignment_users;"
```

---

## 📊 Estructura de Servicios

```
┌─────────────────────────────────────────┐
│        Kong API Gateway (8000)          │
└─────────────────────────────────────────┘
           │         │         │
    ┌──────┴──┬──────┴──┬──────┴──┐
    │         │         │         │
    ▼         ▼         ▼         ▼
 Asigna.  Vehículos  Personas  Zonas
 (3002)   (3000)     (3001)    (8080)
    │         │         │         │
    └─────────┴─────────┴─────────┘
              │
              ▼
    ┌──────────────────┐
    │  PostgreSQL      │
    │  (5432)          │
    └──────────────────┘
```

---

## ⚙️ Variables de Entorno

Las variables están configuradas en el `docker-compose.yml`:

```yaml
# PostgreSQL
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres

# Kong
KONG_PG_USER: kong
KONG_PG_PASSWORD: kong123

# Asignación
VEHICLE_SERVICE_URL: http://vehiculos:3000
USER_SERVICE_URL: http://personas:3001
ZONE_SERVICE_URL: http://zonas:8080
```

Para cambiar, edita `docker-compose.yml` y reinicia:

```bash
docker-compose restart <servicio>
```

---

## 🔍 Troubleshooting

### "Port already in use"

```bash
# Ver qué está usando el puerto
lsof -i :3002

# O cambiar el puerto en docker-compose.yml
# Cambiar "3002:3002" por "3003:3002"
```

### Servicio no inicia

```bash
# Ver logs detallados
docker-compose logs asignacion-trazabilidad

# Reconstruir
docker-compose up -d --build asignacion-trazabilidad
```

### PostgreSQL no inicia

```bash
# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres

# Si no funciona, eliminar datos
docker-compose down -v
docker-compose up -d
```

### Kong no conecta con servicios

```bash
# Verificar conectividad desde Kong
docker-compose exec kong wget -O- http://asignacion-trazabilidad:3002/api/asignaciones/health

# Si no funciona:
# 1. Verificar que todos los servicios estén "Up"
# 2. Verificar que están en la misma red: parqueadero-network
```

### "Network parqueadero-network not found"

```bash
# Crear la red manualmente
docker network create parqueadero-network

# O simplemente reiniciar
docker-compose down
docker-compose up -d
```

---

## 📝 Workflow Típico

### Desarrollo

```bash
# 1. Levantar todos los servicios
docker-compose up -d --build

# 2. Ver logs
docker-compose logs -f

# 3. Hacer cambios en código
# ... editar archivos ...

# 4. Reconstruir solo un servicio
docker-compose up -d --build asignacion-trazabilidad

# 5. Ver logs del cambio
docker-compose logs -f asignacion-trazabilidad

# 6. Detener cuando termines
docker-compose stop
```

### Pruebas

```bash
# Levantar
docker-compose up -d

# Correr tests en asignación
docker-compose exec asignacion-trazabilidad npm run test

# Ver cobertura
docker-compose exec asignacion-trazabilidad npm run test:cov
```

### Limpieza

```bash
# Parar servicios
docker-compose down

# Eliminar volúmenes (borra datos)
docker-compose down -v

# Eliminar imágenes también
docker-compose down -v --rmi all
```

---

## 🔐 Seguridad en Docker

### Los servicios están en red aislada

```
parqueadero-network (bridge)
- Solo los servicios dentro de esta red se conectan
- No expone puertos internos, solo los definidos
```

### Variables sensibles

**Cambiar en producción:**
```yaml
environment:
  POSTGRES_PASSWORD: CAMBIAR_AQUI
  KONG_PG_PASSWORD: CAMBIAR_AQUI
```

### Acceso a BD

Solo desde dentro de los contenedores:
```bash
# Desde dentro de Kong
docker-compose exec kong psql -h kong-db -U kong kong

# Desde Asignación
docker-compose exec asignacion-trazabilidad npm run test
```

---

## 📊 Monitoreo

### Uso de Recursos

```bash
# Ver CPU, memoria, etc.
docker stats

# Por servicio
docker-compose exec postgres ps aux
```

### Health Checks

```bash
# Verificar estado
curl http://localhost:3002/api/asignaciones/health
curl http://localhost:8001/status
curl http://localhost:8080/actuator/health
```

---

## 🔄 Actualizar Imágenes

```bash
# Descargar última versión
docker pull node:20-alpine
docker pull postgres:16-alpine
docker pull kong:3.6-alpine

# Reconstruir con nuevas imágenes
docker-compose down
docker-compose up -d --build
```

---

## 📚 Documentación Relacionada

- `README.md` - Descripción general del proyecto
- `GITHUB_SETUP.md` - Instrucciones de GitHub
- `EVALUACION_CUMPLIMIENTO.md` - Requisitos cumplidos

---

**Última actualización:** 2024-06-24
