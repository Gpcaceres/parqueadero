# 🔧 Reparación de Errores Docker - NPM Dependencies

## 🐛 Problemas Encontrados

El error `npm error eresolve-report.txt` en Docker indica conflictos de resolución de dependencias en npm.

**Afectados:**
- ✅ **ms-tickets** - REPARADO (Dockerfile actualizado)
- ✅ **personas** - Ya usa `--legacy-peer-deps`
- ✅ **vehiculos** - Ya usa `--legacy-peer-deps`
- ✅ **asignacion-trazabilidad** - Ya usa `--legacy-peer-deps`

## 🔨 Soluciones Aplicadas

### 1. Actualizar ms-tickets/Dockerfile
✅ Cambió de `npm ci` a `npm install --legacy-peer-deps`
✅ Agregado `npm cache clean --force`

**Antes:**
```dockerfile
RUN npm ci
RUN npm ci --only=production
```

**Después:**
```dockerfile
RUN npm install --legacy-peer-deps
RUN npm install --legacy-peer-deps --only=production && npm cache clean --force
```

## 🚀 Cómo Reparar

### Opción 1: Limpiar y Reconstruir (Recomendado)

```bash
# Detener servicios
docker-compose down

# Limpiar imágenes y build cache
docker system prune -a

# Limpiar volumes (CUIDADO: borra datos)
docker volume prune

# Reconstruir
docker-compose up --build

# O solo ms-tickets
docker-compose up --build ms-tickets
```

### Opción 2: Reconstruir sin Limpiar

```bash
# Detener solo el servicio afectado
docker-compose stop ms-tickets

# Remover imagen anterior
docker rmi ms-tickets-app:latest

# Reconstruir
docker-compose up --build ms-tickets
```

### Opción 3: Fuerza Máxima

```bash
# Detener todo
docker-compose down

# Remover todo relacionado a Parqueadero
docker system prune -a --volumes

# Eliminar node_modules locales (opcional)
rm -r ms-tickets/node_modules personas/node_modules vehiculos/node_modules asignacion-trazabilidad/node_modules

# Reconstruir
docker-compose up --build
```

## 📋 Checklist de Verificación

Después de reparar, verificar que cada servicio esté saludable:

```bash
# Ver estado de servicios
docker-compose ps

# Verificar logs
docker-compose logs ms-tickets
docker-compose logs personas
docker-compose logs vehiculos
docker-compose logs asignacion-trazabilidad

# Health checks
curl http://localhost:3003/health          # ms-tickets
curl http://localhost:3001/health          # personas
curl http://localhost:3000/health          # vehiculos
curl http://localhost:3002/api/asignaciones/health  # asignacion-trazabilidad
```

## ✅ Señales de Éxito

```bash
# Estado esperado
docker-compose ps

NAME                           STATUS              PORTS
parqueadero-postgres           Up 2 minutes        5432/tcp
kong-postgres                  Up 2 minutes        5433/tcp
kong-migration                 Exited (0)          
kong-gateway                   Up 1 minute         8000/tcp, 8001/tcp, 8443/tcp, 8444/tcp
kong-manager                   Up 1 minute         8002/tcp
kong-setup                     Exited (0)          
asignacion-trazabilidad-app    Up 1 minute         3002/tcp
vehiculos-app                  Up 1 minute         3000/tcp
personas-app                   Up 1 minute         3001/tcp
zonas-app                      Up 1 minute         8080/tcp
ms-tickets-app                 Up 1 minute         3003/tcp
```

## 🌐 Acceso Post-Reparación

```
API Gateway (Kong):    http://localhost:8000
Admin Kong:            http://localhost:8001
Manager Kong:          http://localhost:8002

Servicios Directos:
- Vehículos:           http://localhost:3000/swagger
- Personas:            http://localhost:3001/swagger
- Asignación:          http://localhost:3002/swagger
- Tickets:             http://localhost:3003/swagger
- Zonas:               http://localhost:8080/swagger-ui.html
```

## 📊 Rutas a través de Kong

```
GET /vehiculos                      → http://localhost:8000/vehiculos
GET /personas                       → http://localhost:8000/personas
GET /auth/login                     → http://localhost:8000/auth/login
GET /api/asignaciones              → http://localhost:8000/api/asignaciones
GET /api/v1/zonas                  → http://localhost:8000/api/v1/zonas
GET /tickets                        → http://localhost:8000/tickets
```

## ⚠️ Troubleshooting

### Si persisten errores

```bash
# Ver logs detallados
docker-compose logs -f ms-tickets

# Revisar dependencias directamente
docker-compose exec ms-tickets npm list

# Entrar al contenedor
docker-compose exec ms-tickets sh

# Dentro del contenedor, reinstalar
npm install --legacy-peer-deps
npm run build
```

### Error: "no space left on device"

```bash
# Limpiar espacio en disco
docker system prune -a --volumes

# O eliminar imágenes huérfanas
docker image prune -a
```

### Error: "port already in use"

```bash
# Encontrar qué usa el puerto
lsof -i :3003

# Matar proceso (Linux/Mac)
kill -9 <PID>

# En Windows, usar Task Manager o:
netstat -ano | findstr :3003
taskkill /PID <PID> /F
```

## 📝 Cambios Realizados

### ✅ ms-tickets/Dockerfile
```diff
- RUN npm ci
+ RUN npm install --legacy-peer-deps

- RUN npm ci --only=production
+ RUN npm install --legacy-peer-deps --only=production && npm cache clean --force
```

## 🎯 Resumen

| Servicio | Estado | Solución |
|----------|--------|----------|
| ms-tickets | ✅ Reparado | Actualizar Dockerfile |
| personas | ✅ OK | Usa --legacy-peer-deps |
| vehiculos | ✅ OK | Usa --legacy-peer-deps |
| asignacion-trazabilidad | ✅ OK | Usa --legacy-peer-deps |
| zonas | ✅ OK | Usa Gradle |

---

**Después de aplicar estas soluciones, Docker debería construir correctamente.** 🚀
