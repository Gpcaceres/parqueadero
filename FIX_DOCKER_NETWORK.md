# 🌐 Solución de Problemas de Red en Docker

## 🐛 Problema

```
npm error network In most cases you are behind a proxy or have bad network settings.
exit code: 152
```

**Causas:**
- Docker Desktop con conectividad lenta
- Timeout en descargas de npm
- Repositorio npm saturado
- Caché corrupto

## ✅ Soluciones

### Opción 1: Reiniciar Docker Desktop (Más Rápido)

```bash
# Windows - Reiniciar Docker Desktop
1. Cerrar Docker Desktop completamente
2. Abrir Task Manager
3. Buscar "Docker Desktop" y terminar el proceso
4. Esperar 30 segundos
5. Abrir Docker Desktop nuevamente
6. Esperar a que esté listo (icono estable)
7. Ejecutar: docker-compose up --build
```

### Opción 2: Limpiar y Usar Repositorio Rápido

```bash
# Detener todo
docker-compose down

# Limpiar cache de npm en Docker
docker system prune -a -f --volumes

# Configurar npm con repositorio más rápido
npm config set registry https://registry.npmjs.org/

# Aumentar timeout
npm config set fetch-timeout 120000
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 10000
npm config set fetch-retry-maxtimeout 120000

# Reconstruir
docker-compose up --build -d
```

### Opción 3: Dockerfile Optimizado (Recomendado)

Actualizar todos los Dockerfiles con configuración optimizada.

**Cambios:**
- Aumentar timeout de npm
- Agregar reintentos
- Usar repositorio rápido
- Limpiar cache entre pasos

## 🔧 Dockerfile Optimizado

### Para Node.js (personas, vehiculos, ms-tickets, asignacion-trazabilidad)

```dockerfile
# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Configurar npm para mejor conectividad
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set registry https://registry.npmjs.org/

COPY package*.json ./

# Instalar con reintentos
RUN npm install --legacy-peer-deps --verbose || \
    npm install --legacy-peer-deps --verbose || \
    npm install --legacy-peer-deps --verbose

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Configurar npm
RUN npm config set fetch-timeout 120000 && \
    npm config set registry https://registry.npmjs.org/

COPY package*.json ./

RUN npm install --legacy-peer-deps --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

## 🚀 Pasos Recomendados

### Paso 1: Reiniciar Docker Desktop
```bash
# En Windows, presionar Win + R
taskkill /IM "Docker Desktop.exe" /F
# Esperar 30 segundos
# Abrir Docker Desktop nuevamente
```

### Paso 2: Esperar a que Docker esté listo
```bash
# Esperar a que el icono de Docker sea estable
# (~1-2 minutos)
docker ps  # Esto debería funcionar sin errores
```

### Paso 3: Limpiar todo
```bash
docker-compose down
docker system prune -a -f --volumes
docker volume prune -f
```

### Paso 4: Reconstruir
```bash
# Lentamente, uno a la vez
docker-compose up --build ms-tickets -d
docker-compose up --build personas -d
docker-compose up --build vehiculos -d
docker-compose up --build asignacion-trazabilidad -d
```

### Paso 5: Verificar
```bash
docker-compose ps
docker-compose logs
```

## 📊 Alternativa: Construir Localmente Primero

```bash
# En lugar de Docker, construir en local

# Personas
cd personas
npm install --legacy-peer-deps
npm run build
npm run start:prod

# En otra terminal - Vehículos
cd vehiculos
npm install --legacy-peer-deps
npm run build
npm run start:prod

# etc...
```

## ⚙️ Configuración de Docker Desktop

### Aumentar Recursos (Windows)

1. Docker Desktop → Settings
2. Resources → Advanced
3. Aumentar:
   - CPUs: 4 → 6-8
   - Memory: 2GB → 4-6GB
   - Disk: aumentar si es necesario

### Activar WSL2 Backend (Opcional pero Recomendado)

1. Settings → General
2. ✓ "Use the WSL 2 based engine"
3. Reiniciar Docker Desktop

## 🔍 Diagnóstico

```bash
# Ver conectividad de Docker
docker run --rm alpine ping -c 3 google.com

# Ver conectividad a npm
docker run --rm node npm ping

# Ver logs de Docker
docker logs $(docker ps -q)

# Ver espacio disponible
docker system df

# Ver eventos en tiempo real
docker events
```

## 📝 Checklist de Solución

- [ ] Cerrar completamente Docker Desktop
- [ ] Esperar 30 segundos
- [ ] Abrir Docker Desktop nuevamente
- [ ] Esperar a que esté completamente listo (~2 min)
- [ ] Ejecutar: `docker system prune -a -f --volumes`
- [ ] Ejecutar: `docker-compose up --build -d`
- [ ] Esperar 2-3 minutos por descarga
- [ ] Verificar: `docker-compose ps`
- [ ] Verificar: `curl http://localhost:3001/health`

## ⏱️ Tiempo Estimado

- Reiniciar Docker: 2-3 minutos
- Limpiar: 30 segundos
- Descargar dependencias: 5-10 minutos (dependiente de conexión)
- Build: 2-3 minutos por servicio
- **Total: 15-20 minutos**

## 🆘 Si Sigue Fallando

### Opción Nuclear (Última Instancia)

```bash
# Resetear Docker completamente
docker system prune -a -f --volumes
# En Windows, Settings → Reset Docker Desktop to factory defaults
```

### Alternativa: Docker en WSL2

```bash
# Si estás en Windows, usar WSL2 es más estable
# Requiere Windows 10/11 Pro o Enterprise
```

## 🌐 URLs Después de Funcionar

```
Personas:      http://localhost:3001/swagger
Tickets:       http://localhost:3003/swagger
Vehículos:     http://localhost:3000/swagger
Asignación:    http://localhost:3002/swagger
Kong:          http://localhost:8000
```

---

**La solución más probable: Reiniciar Docker Desktop** ✅
