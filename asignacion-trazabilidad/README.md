# 🚗 Microservicio de Asignación y Trazabilidad

Microservicio integral para gestión de asignaciones de vehículos a propietarios con trazabilidad e integración a otros servicios.

## 📋 Características

- ✅ **Asignación de Vehículos** - Asociar vehículos a propietarios con claves compuestas
- ✅ **Trazabilidad Completa** - Registro inmutable de todos los cambios
- ✅ **Consulta de Flota** - Obtener vehículos de un usuario con detalles integrados
- ✅ **Auditoría Robusta** - Base de datos separada para registros de cambios
- ✅ **Integración Kong** - Integrado con API Gateway centralizado
- ✅ **Tests Unitarios** - Cobertura completa con Jest
- ✅ **Swagger/OpenAPI** - Documentación automática

## 🛠️ Stack Tecnológico

- **Framework:** NestJS 10
- **BD:** PostgreSQL 16
- **ORM:** TypeORM
- **Testing:** Jest
- **HTTP Client:** Axios
- **Documentación:** Swagger/OpenAPI

## 📁 Estructura

```
src/
├── entities/
│   ├── assignment.entity.ts        # Modelo de asignación
│   └── audit-trail.entity.ts       # Modelo de auditoría
├── repositories/
│   ├── assignment.repository.ts    # Acceso a asignaciones
│   └── audit-trail.repository.ts   # Acceso a auditoría
├── services/
│   ├── assignment.service.ts       # Lógica de asignación
│   ├── audit.service.ts            # Lógica de auditoría
│   └── vehicle-integration.service.ts # Integración con vehículos
├── controllers/
│   └── assignment.controller.ts    # Endpoints REST
├── dtos/
│   ├── create-assignment.dto.ts
│   ├── assignment.dto.ts
│   └── audit-trail.dto.ts
├── app.module.ts
└── main.ts
```

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- PostgreSQL 16
- Docker (opcional)

### Instalación

```bash
cd asignacion-trazabilidad
npm install
```

### Configuración

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar variables si es necesario:

```env
NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=5434
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=asignacion_db
VEHICLE_SERVICE_URL=http://localhost:3000
```

### Levantar Servicios

```bash
# BD en Docker
docker-compose up -d

# Esperar a que PostgreSQL esté listo (10 segundos)
sleep 10

# Aplicación
npm run start:dev
```

Acceder a:
- API: `http://localhost:3002/api/asignaciones`
- Swagger: `http://localhost:3002/swagger`
- Health: `http://localhost:3002/api/asignaciones/health`

## 📡 API Endpoints

### Asignaciones

#### Crear Asignación
```
POST /api/asignaciones

Body:
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "vehicleId": "550e8400-e29b-41d4-a716-446655440001",
  "notes": "Vehículo principal" (opcional)
}

Response: 201 Created
```

#### Obtener Flota del Usuario
```
GET /api/asignaciones/usuario/{userId}?includeInactive=false

Response: 200 OK
[
  {
    "userId": "...",
    "vehicleId": "...",
    "isActive": true,
    "vehicle": {
      "id": "...",
      "type": "Automóvil",
      "category": "Eléctrico",
      "brand": "Tesla",
      "model": "Model 3"
    }
  }
]
```

#### Estadísticas del Usuario
```
GET /api/asignaciones/usuario/{userId}/estadisticas

Response: 200 OK
{
  "userId": "...",
  "activeVehicles": 5,
  "totalAssignments": 7,
  "revokedAssignments": 2
}
```

#### Revocar Asignación
```
DELETE /api/asignaciones/{userId}/{vehicleId}

Response: 200 OK
```

### Trazabilidad

#### Historial de Asignación
```
GET /api/asignaciones/trazabilidad/{userId}/{vehicleId}

Response: 200 OK
[
  {
    "eventId": "uuid",
    "actionType": "CREACIÓN",
    "performedByUserId": "admin-id",
    "description": "Vehículo asignado a propietario",
    "createdAt": "2024-06-24T14:30:45Z",
    "newState": {...}
  }
]
```

#### Auditoría de Usuario
```
GET /api/asignaciones/auditoría/usuario/{userId}

Response: 200 OK
[eventos de auditoría...]
```

#### Auditoría de Vehículo
```
GET /api/asignaciones/auditoría/vehículo/{vehicleId}

Response: 200 OK
[eventos de auditoría...]
```

#### Búsqueda Avanzada
```
GET /api/asignaciones/auditoría/buscar?userId=...&actionType=CREACIÓN&fromDate=2024-06-01&toDate=2024-06-30&page=1&limit=50

Response: 200 OK
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

#### Eventos Recientes
```
GET /api/asignaciones/auditoría/eventos-recientes?limit=50

Response: 200 OK
[...]
```

#### Resumen de Actividad
```
GET /api/asignaciones/auditoría/resumen?userId=optional-id

Response: 200 OK
[
  {
    "actionType": "CREACIÓN",
    "count": 25
  },
  {
    "actionType": "ELIMINACIÓN",
    "count": 10
  }
]
```

#### Usuarios Más Activos
```
GET /api/asignaciones/auditoría/usuarios-activos?limit=10

Response: 200 OK
[
  {
    "userId": "...",
    "eventCount": 150
  }
]
```

### Propietario

#### Obtener Propietario Actual
```
GET /api/asignaciones/vehículo/{vehicleId}/propietario

Response: 200 OK
{
  "vehicleId": "...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "isAssigned": true
}
```

### Health

#### Verificar Salud del Servicio
```
GET /api/asignaciones/health

Response: 200 OK
{
  "status": "UP",
  "services": {
    "asignacion": "UP",
    "vehiculos": "UP"
  }
}
```

## 🧪 Testing

```bash
# Correr tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

## 🔗 Integración con Kong

Registrar el servicio en Kong:

```bash
cd ../kong-gateway

./register-service.sh asignacion-trazabilidad \
  http://host.docker.internal:3002 \
  /api/asignaciones \
  /api/trazabilidad \
  /api/auditoría
```

Acceder vía Kong:
```
http://localhost:8000/api/asignaciones
```

## 📊 Base de Datos

### Tablas

#### assignments
Almacena asignaciones activas e inactivas.

```sql
CREATE TABLE assignments (
  user_id UUID,
  vehicle_id UUID,
  is_active BOOLEAN DEFAULT true,
  assigned_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, vehicle_id),
  UNIQUE INDEX idx_user_vehicle (user_id, vehicle_id)
);
```

#### audit_trails
Registra inmutable de todos los cambios.

```sql
CREATE TABLE audit_trails (
  event_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  action_type ENUM ('CREACIÓN', 'MODIFICACIÓN', 'ELIMINACIÓN'),
  performed_by_user_id UUID,
  previous_state JSONB,
  new_state JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);
```

## 🔄 Flujo de Operación

### Crear Asignación

```
1. Cliente POST /api/asignaciones
  ↓
2. AssignmentService.assignVehicleToUser()
  - Valida claves compuestas
  - Verifica vehículo no esté asignado
  - Crea registro en BD
  ↓
3. AuditService.logAssignmentCreated()
  - Registra evento en audit_trails
  ↓
4. VehicleIntegrationService (opcional)
  - Obtiene detalles del vehículo
  - Enriquece respuesta
  ↓
5. Respuesta 201 Created
```

### Revocar Asignación

```
1. Cliente DELETE /api/asignaciones/{userId}/{vehicleId}
  ↓
2. AssignmentService.revokeAssignment()
  - Encuentra asignación activa
  - Marca como inactiva
  ↓
3. AuditService.logAssignmentRevoked()
  - Registra revocación
  - Almacena ANTES y DESPUÉS
  ↓
4. Respuesta 200 OK
```

### Consultar Flota

```
1. Cliente GET /api/asignaciones/usuario/{userId}
  ↓
2. AssignmentService.getUserFleet()
  - Obtiene asignaciones activas del usuario
  ↓
3. VehicleIntegrationService.enrichAssignmentsWithVehicles()
  - Obtiene detalles de vehículos
  - Agrega al objeto de respuesta
  ↓
4. Respuesta 200 OK con vehículos enriquecidos
```

## 🐛 Troubleshooting

### "Connection refused" a BD

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose down -v
docker-compose up -d
```

### Integración con vehículos no funciona

```bash
# Verificar URL configurada
echo $VEHICLE_SERVICE_URL

# Test directo
curl http://localhost:3000/api/vehiculos/health

# Cambiar en .env si es necesario
VEHICLE_SERVICE_URL=http://host.docker.internal:3000
```

### Tests falla

```bash
# Limpiar cache de Jest
npm run test -- --clearCache

# Correr nuevamente
npm run test
```

## 📚 Documentación Adicional

- `REQUISITOS.md` - Cumplimiento detallado de requisitos
- `ARCHITECTURE.md` - Diseño técnico
- Swagger: `http://localhost:3002/swagger`

## 🤝 Convenciones

- ✅ Nombres en español para dominio (asignaciones, trazabilidad)
- ✅ Códigos en inglés (variables, funciones)
- ✅ UUIDs para todos los IDs
- ✅ Timestamps con zona horaria UTC
- ✅ JSONB para datos dinámicos
- ✅ Índices en campos frecuentemente consultados

## 📝 Licencia

MIT

---

**Última actualización:** 2024-06-24
