# 🅿️ Parqueadero Inteligente - Sistema Integral de Gestión

**Sistema de microservicios para la gestión inteligente de parqueaderos con asignación de vehículos, trazabilidad, y API Gateway centralizado.**

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Microservicios](#microservicios)
- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Documentación](#documentación)
- [Contribuir](#contribuir)

---

## 📖 Descripción

**Parqueadero** es un sistema integral para la gestión inteligente de parqueaderos que permite:

- ✅ Asociar vehículos a propietarios
- ✅ Registrar automáticamente todos los cambios (trazabilidad)
- ✅ Consultar flota de vehículos enriquecida con datos
- ✅ Enrutar todas las APIs a través de un gateway centralizado
- ✅ Integración entre múltiples microservicios

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  Clientes Externos                  │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼ (Puerto 8000)
                  ┌──────────────────┐
                  │  Kong Gateway    │
                  │  API Centralizado│
                  └────────┬─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐        ┌─────────┐      ┌──────────┐
    │ Zonas  │        │Vehículos│      │Asignación│
    │(8080)  │        │ (3000)  │      │(3002)    │
    └────────┘        └─────────┘      └──────────┘
        │                  │                  │
        ├──────────────────┼──────────────────┤
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   PostgreSQL Compartida           │
        │   Usuarios, Vehículos, Zonas     │
        └──────────────────────────────────┘
```

---

## 🔧 Microservicios

### 1. **Kong API Gateway** (Independiente)
- **Puerto:** 8000 (proxy), 8001 (admin)
- **Ubicación:** `/kong-gateway`
- **Función:** Punto único de entrada, enrutamiento centralizado
- **BD:** PostgreSQL (5433)

**Documentación:** Ver `kong-gateway/README.md`

### 2. **Asignación y Trazabilidad** (NestJS)
- **Puerto:** 3002
- **Ubicación:** `/asignacion-trazabilidad`
- **Función:** Gestionar asignaciones de vehículos y auditoría
- **BD:** PostgreSQL (5434)
- **Stack:** NestJS, TypeORM, PostgreSQL

**Documentación:**
- `asignacion-trazabilidad/README.md` - Guía de uso
- `asignacion-trazabilidad/REQUISITOS.md` - Requisitos cumplidos
- `asignacion-trazabilidad/INTEGRACIONES.md` - Integración con otros servicios

### 3. **Vehículos** (NestJS)
- **Puerto:** 3000
- **Ubicación:** `/vehiculos`
- **Función:** Gestionar catálogo de vehículos
- **Stack:** NestJS, TypeORM

### 4. **Zonas** (Spring Boot)
- **Puerto:** 8080
- **Ubicación:** `/zonas`
- **Función:** Gestionar zonas y espacios de estacionamiento
- **Stack:** Spring Boot, JPA/Hibernate, PostgreSQL

### 5. **Personas** (NestJS)
- **Puerto:** 3001
- **Ubicación:** `/personas`
- **Función:** Gestionar usuarios y roles
- **Stack:** NestJS, TypeORM

---

## ✨ Características

### 🚗 Asignación de Vehículos
- Clave compuesta (usuario + vehículo)
- Validación: usuario activo, vehículo existe
- Un vehículo solo en un propietario activo

### 📊 Trazabilidad Completa
- Registro inmutable de cambios
- Tabla separada (`audit_trails`)
- Snapshots JSONB (antes/después)
- Timestamps con zona horaria
- Tipos de evento: CREACIÓN, MODIFICACIÓN, ELIMINACIÓN

### 🔗 Integración entre Servicios
- Asignación consulta Usuario y Vehículos
- Enriquecimiento automático de datos
- Health checks centralizados
- Comunicación por HTTP

### 🌐 API Gateway Centralizado
- Punto único de entrada (http://localhost:8000)
- Rate limiting
- CORS
- Autenticación API Key
- Monitoreo

### 📚 Documentación Automática
- Swagger/OpenAPI en cada servicio
- API Explorer interactivo
- Schemas validados

---

## 📦 Requisitos

### Software
- **Node.js** 18+
- **npm** o **pnpm**
- **Java** 21+ (para Zonas)
- **Maven** 3.9+ (para Zonas)
- **PostgreSQL** 16+
- **Docker** (opcional, recomendado)
- **Docker Compose** (opcional, recomendado)

### Sistema Operativo
- Windows, macOS o Linux

---

## 🚀 Instalación

### Opción 1: Con Docker Compose (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/username/parqueadero.git
cd parqueadero

# Levantar todos los servicios
docker-compose up -d

# Verificar que están corriendo
docker-compose ps
```

### Opción 2: Manual (Desarrollo)

#### 1. Instalar dependencias de Kong

```bash
cd kong-gateway
docker-compose up -d

# Esperar 30 segundos a que arranque
sleep 30

# Registrar servicios
./register-service.sh zonas http://host.docker.internal:8080 /api/zonas
./register-service.sh vehiculos http://host.docker.internal:3000 /api/vehiculos
./register-service.sh asignacion-trazabilidad http://host.docker.internal:3002 /api/asignaciones
```

#### 2. Instalar y ejecutar Asignación y Trazabilidad

```bash
cd asignacion-trazabilidad

# Copiar .env
cp .env.example .env

# BD
docker-compose up -d

# Dependencias
npm install

# Ejecutar
npm run start:dev

# Acceder a Swagger: http://localhost:3002/swagger
```

#### 3. Instalar y ejecutar Vehículos

```bash
cd vehiculos

cp .env.example .env
npm install
npm run start:dev
```

#### 4. Instalar y ejecutar Zonas

```bash
cd zonas

docker-compose up -d
mvn clean install
mvn spring-boot:run
```

#### 5. Instalar y ejecutar Personas

```bash
cd personas

npm install
npm run start:dev
```

---

## 🌐 URLs de Acceso

| Servicio | Puerto | URL | Swagger |
|----------|--------|-----|---------|
| Kong Proxy | 8000 | http://localhost:8000 | - |
| Kong Admin | 8001 | http://localhost:8001 | - |
| Kong Manager | 8002 | http://localhost:8002 | - |
| Asignación | 3002 | http://localhost:3002 | http://localhost:3002/swagger |
| Vehículos | 3000 | http://localhost:3000 | http://localhost:3000/swagger |
| Personas | 3001 | http://localhost:3001 | http://localhost:3001/swagger |
| Zonas | 8080 | http://localhost:8080 | http://localhost:8080/swagger-ui.html |

---

## 📡 Uso

### 1. Health Check

```bash
curl http://localhost:3002/api/asignaciones/health
```

### 2. Crear Asignación

```bash
curl -X POST http://localhost:8000/api/asignaciones \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "vehicleId": "550e8400-e29b-41d4-a716-446655440001",
    "notes": "Vehículo principal"
  }'
```

### 3. Consultar Flota

```bash
curl http://localhost:8000/api/asignaciones/usuario/550e8400-e29b-41d4-a716-446655440000
```

### 4. Ver Trazabilidad

```bash
curl http://localhost:8000/api/asignaciones/trazabilidad/550e8400-e29b-41d4-a716-446655440000/550e8400-e29b-41d4-a716-446655440001
```

---

## 📚 Documentación

| Documento | Contenido |
|-----------|-----------|
| **GITHUB_SETUP.md** | Instrucciones para subir a GitHub |
| **EVALUACION_CUMPLIMIENTO.md** | Evaluación vs requisitos |
| **kong-gateway/README.md** | Guía de Kong |
| **asignacion-trazabilidad/README.md** | Guía del microservicio |
| **asignacion-trazabilidad/REQUISITOS.md** | RF1, RF2, RF3 |
| **asignacion-trazabilidad/INTEGRACIONES.md** | Integración con otros servicios |

---

## 🧪 Testing

### Asignación y Trazabilidad

```bash
cd asignacion-trazabilidad

# Correr tests
npm run test

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

---

## 🔄 Flujo de Desarrollo

1. **Crear rama de feature**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Hacer cambios**
   ```bash
   # Editar código
   ```

3. **Correr tests**
   ```bash
   npm run test
   ```

4. **Commit y push**
   ```bash
   git add .
   git commit -m "Descripción clara del cambio"
   git push origin feature/nueva-funcionalidad
   ```

5. **Crear Pull Request en GitHub**

---

## 🐛 Troubleshooting

### Kong no arranca

```bash
cd kong-gateway
docker-compose logs kong
docker-compose restart
```

### Asignación no se conecta a vehículos

```bash
# Verificar variable de entorno
echo $VEHICLE_SERVICE_URL

# Verificar conectividad
curl http://localhost:3000/api/vehiculos/health
```

### Port already in use

```bash
# Cambiar puerto en docker-compose.yml
# O liberar el puerto:
lsof -i :3002
kill -9 <PID>
```

---

## 📋 Requisitos Cumplidos

Este proyecto cumple completamente con la "Evaluación Conjunta" que incluye:

- ✅ **RF1:** Asignación de vehículos a propietarios con claves compuestas
- ✅ **RF2:** Registro de trazabilidad en tabla separada con snapshots JSONB
- ✅ **RF3:** Consulta de flota con integración a Microservicio de Vehículos
- ✅ **Modelado de Datos:** Clave compuesta correctamente implementada
- ✅ **Trazabilidad Robusta:** Desacoplamiento e inmutabilidad
- ✅ **Integración:** Comunicación con Usuarios, Vehículos, Zonas
- ✅ **Calidad de Código:** Clean Code, Tests, Documentación

Ver: `EVALUACION_CUMPLIMIENTO.md`

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

---

## 👨‍💼 Autor

**Germancin**
- Email: ithopc@gmail.com

---

## 📞 Soporte

Para reportar problemas o sugerencias, abre un issue en GitHub.

---

## 🔗 Enlaces Rápidos

- [Kong Documentation](https://docs.konghq.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Última actualización:** 2024-06-24
