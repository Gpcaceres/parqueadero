# 🔗 Integraciones con Microservicios

Documento que detalla cómo el microservicio de Asignación y Trazabilidad se integra y consume los otros microservicios del proyecto Parqueadero.

---

## 📊 Arquitectura de Integraciones

```
┌──────────────────────────────────────────────────────┐
│     Asignación y Trazabilidad (3002)                │
└────────┬───────────────────────────────────────────┘
         │
         ├─→ Microservicio de Vehículos (3000)
         │   - Validar existencia
         │   - Obtener detalles (tipo, categoría, marca)
         │   - Enriquecer respuestas
         │
         ├─→ Microservicio de Personas (3001)
         │   - Validar usuario existe
         │   - Verificar usuario activo
         │   - Obtener detalles del propietario
         │
         └─→ Microservicio de Zonas (8080)
             - Información de disponibilidad
             - Estadísticas de ocupación
             - Historial de uso

```

---

## 🔌 Integración 1: Microservicio de Vehículos

**Ubicación:** `src/services/vehicle-integration.service.ts`

**Propósito:** Validar y obtener información de vehículos

### Métodos Implementados

#### 1. `getVehicleDetails(vehicleId: string)`
Obtiene detalles de un vehículo específico.

```typescript
const vehicle = await this.vehicleIntegrationService.getVehicleDetails(vehicleId);
// Response:
{
  id: "uuid",
  type: "Automóvil",           // Moto, Automóvil, Camioneta
  category: "Eléctrico",        // Eléctrico, Híbrido, Combustión
  brand: "Tesla",
  model: "Model 3",
  licensePlate: "ABC-123",
  year: 2024
}
```

**Endpoint usado:**
```
GET {VEHICLE_SERVICE_URL}/api/vehiculos/{vehicleId}
```

#### 2. `vehicleExists(vehicleId: string): Promise<boolean>`
Verifica si un vehículo existe sin esperar todos los detalles.

```typescript
const exists = await vehicleIntegrationService.vehicleExists(vehicleId);
// Response: true/false
```

**Usado en:** Validación previa a crear asignación

#### 3. `getVehiclesDetails(vehicleIds: string[])`
Obtiene detalles de múltiples vehículos (batch).

```typescript
const vehicles = await vehicleIntegrationService.getVehiclesDetails([
  "uuid-1",
  "uuid-2",
  "uuid-3"
]);
// Response: Array de vehículos
```

**Endpoint usado:**
```
POST {VEHICLE_SERVICE_URL}/api/vehiculos/batch
Body: { ids: ["uuid-1", "uuid-2", ...] }
```

#### 4. `enrichAssignmentWithVehicle(assignment: any)`
Agrega información del vehículo a una asignación.

```typescript
const enriched = await vehicleIntegrationService
  .enrichAssignmentWithVehicle(assignment);
// Añade: assignment.vehicle = { id, type, category, brand, model, ... }
```

#### 5. `enrichAssignmentsWithVehicles(assignments: any[])`
Enriquece múltiples asignaciones con detalles de vehículos.

```typescript
const enriched = await vehicleIntegrationService
  .enrichAssignmentsWithVehicles(assignments);
// Response: Asignaciones con detalles de vehículos
```

**Usado en:** `GET /api/asignaciones/usuario/:userId` (RF3)

### Manejo de Errores

```typescript
try {
  // Intenta obtener detalles
  const vehicle = await getVehicleDetails(vehicleId);
} catch (error) {
  // Si falla:
  // - Log de error
  // - Retorna null
  // - La asignación continúa pero sin detalles del vehículo
  return null;
}
```

### Health Check

```typescript
const isHealthy = await vehicleIntegrationService
  .checkVehicleServiceHealth();

// GET {VEHICLE_SERVICE_URL}/health
```

---

## 🔌 Integración 2: Microservicio de Personas/Usuarios

**Ubicación:** `src/services/user-integration.service.ts`

**Propósito:** Validar usuarios y obtener información de propietarios

### Métodos Implementados

#### 1. `userExists(userId: string): Promise<boolean>`
Verifica si un usuario existe.

```typescript
const exists = await userIntegrationService.userExists(userId);
// Response: true/false
```

**Endpoint usado:**
```
GET {USER_SERVICE_URL}/api/personas/{userId}
```

**Usado en:**
- Validación al crear asignación
- Validación al consultar flota

#### 2. `isUserActive(userId: string): Promise<boolean>`
Verifica si un usuario está activo.

```typescript
const active = await userIntegrationService.isUserActive(userId);
// Response: true/false
```

**Validación:** Antes de permitir asignación, el usuario debe estar activo

#### 3. `getUserDetails(userId: string)`
Obtiene información completa del usuario.

```typescript
const user = await userIntegrationService.getUserDetails(userId);
// Response:
{
  id: "uuid",
  nombre: "Juan Pérez",
  email: "juan@example.com",
  activo: true,
  rol: "usuario" // o "admin"
}
```

#### 4. `getUsersDetails(userIds: string[])`
Obtiene detalles de múltiples usuarios (batch).

```typescript
const users = await userIntegrationService.getUsersDetails([
  "uuid-1",
  "uuid-2"
]);
// Response: Array de usuarios
```

**Endpoint usado:**
```
POST {USER_SERVICE_URL}/api/personas/batch
Body: { ids: ["uuid-1", "uuid-2", ...] }
```

#### 5. `enrichAssignmentsWithUsers(assignments: any[])`
Agrega información del usuario a asignaciones.

```typescript
const enriched = await userIntegrationService
  .enrichAssignmentsWithUsers(assignments);
// Response: Asignaciones con detalles de usuarios
```

**Usado en:** `GET /api/asignaciones/usuario/:userId?enriched=true`

### Validaciones

```typescript
// Al crear asignación, se valida:
1. Usuario existe
   ├─ Si NO existe → BadRequestException
   └─ Si existe:

2. Usuario está activo
   ├─ Si NO está activo → BadRequestException
   └─ Si está activo → Procede

3. Vehículo existe
   └─ Validación con VehicleIntegrationService
```

### Health Check

```typescript
const isHealthy = await userIntegrationService
  .checkUserServiceHealth();

// GET {USER_SERVICE_URL}/health
```

---

## 🔌 Integración 3: Microservicio de Zonas

**Ubicación:** `src/services/zone-integration.service.ts`

**Propósito:** Obtener información de estacionamiento y disponibilidad

### Métodos Implementados

#### 1. `getZoneDetails(zoneId: string)`
Obtiene detalles de una zona de estacionamiento.

```typescript
const zone = await zoneIntegrationService.getZoneDetails(zoneId);
// Response:
{
  id: "uuid",
  nombre: "Zona A",
  totalEspacios: 50,
  espaciosDisponibles: 15,
  tipo: "cubierta"
}
```

**Endpoint usado:**
```
GET {ZONE_SERVICE_URL}/api/zonas/{zoneId}
```

#### 2. `getZoneAvailability(zoneId: string)`
Obtiene disponibilidad actual de una zona.

```typescript
const availability = await zoneIntegrationService
  .getZoneAvailability(zoneId);
// Response:
{
  disponibles: 15,
  ocupados: 35,
  total: 50,
  porcentajeOcupacion: 70
}
```

#### 3. `getZoneSpaces(zoneId: string)`
Obtiene lista de espacios disponibles.

```typescript
const spaces = await zoneIntegrationService.getZoneSpaces(zoneId);
// Response: Array de espacios con estado
```

#### 4. `getAllZones()`
Obtiene todas las zonas disponibles.

```typescript
const zones = await zoneIntegrationService.getAllZones();
// Response: Array de zonas
```

#### 5. `getZoneStatistics(zoneId: string)`
Obtiene estadísticas de una zona.

```typescript
const stats = await zoneIntegrationService
  .getZoneStatistics(zoneId);
// Response: Estadísticas de ocupación, flujo, etc.
```

#### 6. `getZoneOccupancyHistory(zoneId: string, days: number)`
Obtiene historial de ocupación.

```typescript
const history = await zoneIntegrationService
  .getZoneOccupancyHistory(zoneId, 7);
// Response: Historial de últimos 7 días
```

### Health Check

```typescript
const isHealthy = await zoneIntegrationService
  .checkZoneServiceHealth();

// GET {ZONE_SERVICE_URL}/actuator/health
```

---

## 🔄 Flujo de Asignación Completo

### 1. POST `/api/asignaciones` - Crear Asignación

```
Cliente
  │
  ├─→ AssignmentController
       │
       ├─→ UserIntegrationService.userExists(userId)
       │   └─→ GET /api/personas/{userId}
       │
       ├─→ UserIntegrationService.isUserActive(userId)
       │   └─→ GET /api/personas/{userId}
       │
       ├─→ VehicleIntegrationService.vehicleExists(vehicleId)
       │   └─→ GET /api/vehiculos/{vehicleId}
       │
       ├─→ AssignmentService.assignVehicleToUser()
       │   ├─→ Guardar en BD
       │   └─→ AuditService.logAssignmentCreated()
       │
       └─→ VehicleIntegrationService.enrichAssignmentWithVehicle()
           └─→ GET /api/vehiculos/{vehicleId}
               (para detalles en respuesta)
```

**Respuesta:**
```json
{
  "userId": "uuid",
  "vehicleId": "uuid",
  "isActive": true,
  "vehicle": {
    "id": "uuid",
    "type": "Automóvil",
    "category": "Eléctrico",
    "brand": "Tesla",
    "model": "Model 3"
  }
}
```

---

### 2. GET `/api/asignaciones/usuario/{userId}` - Consultar Flota

```
Cliente
  │
  ├─→ AssignmentController
       │
       ├─→ UserIntegrationService.userExists(userId)
       │   └─→ GET /api/personas/{userId}
       │
       ├─→ AssignmentService.getUserFleet(userId)
       │   └─→ BD Query
       │
       ├─→ VehicleIntegrationService.enrichAssignmentsWithVehicles()
       │   ├─→ GET /api/vehiculos/batch
       │   └─→ { ids: ["uuid-1", "uuid-2", ...] }
       │
       └─→ UserIntegrationService.enrichAssignmentsWithUsers()
           └─→ GET /api/personas/batch
               { ids: [userId] }
```

**Respuesta:**
```json
[
  {
    "userId": "uuid",
    "vehicleId": "uuid-1",
    "isActive": true,
    "vehicle": {
      "id": "uuid-1",
      "type": "Automóvil",
      "category": "Eléctrico"
    },
    "user": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "activo": true
    }
  }
]
```

---

### 3. GET `/api/asignaciones/health` - Verificar Estado

```
Cliente
  │
  ├─→ AssignmentController
       │
       ├─→ VehicleIntegrationService.checkVehicleServiceHealth()
       │   └─→ GET /api/vehiculos/health
       │
       ├─→ UserIntegrationService.checkUserServiceHealth()
       │   └─→ GET /api/personas/health
       │
       └─→ ZoneIntegrationService.checkZoneServiceHealth()
           └─→ GET /api/zonas/actuator/health
```

**Respuesta:**
```json
{
  "status": "UP",
  "timestamp": "2024-06-24T14:30:45Z",
  "services": {
    "asignacion": { "status": "UP", "responseTime": "< 10ms" },
    "vehiculos": { "status": "UP", "url": "http://vehiculos:3000" },
    "personas": { "status": "UP", "url": "http://personas:3001" },
    "zonas": { "status": "UP", "url": "http://zonas:8080" }
  },
  "details": {
    "totalServices": 4,
    "healthyServices": 4,
    "message": "Todos los servicios están operacionales"
  }
}
```

---

## ⚙️ Configuración

### Variables de Entorno

```env
# URLs de los microservicios
VEHICLE_SERVICE_URL=http://host.docker.internal:3000
USER_SERVICE_URL=http://host.docker.internal:3001
ZONE_SERVICE_URL=http://host.docker.internal:8080

# En Docker (reemplazar host.docker.internal con nombre del servicio)
VEHICLE_SERVICE_URL=http://vehiculos:3000
USER_SERVICE_URL=http://personas:3001
ZONE_SERVICE_URL=http://zonas:8080
```

---

## 🚀 Ejemplo Completo: Crear Asignación

```bash
# 1. Verificar que los servicios están disponibles
curl http://localhost:3002/api/asignaciones/health

# Respuesta esperada:
# {
#   "status": "UP",
#   "services": {
#     "vehiculos": "UP",
#     "personas": "UP",
#     "zonas": "UP"
#   }
# }

# 2. Crear asignación
curl -X POST http://localhost:3002/api/asignaciones \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "vehicleId": "550e8400-e29b-41d4-a716-446655440001",
    "notes": "Vehículo principal"
  }'

# El servidor validará:
# 1. ✓ Usuario existe en personas
# 2. ✓ Usuario está activo
# 3. ✓ Vehículo existe en vehiculos
# 4. ✓ Vehículo no está asignado a otro usuario
# 5. ✓ Crea la asignación
# 6. ✓ Registra en auditoría
# 7. ✓ Enriquece respuesta con detalles

# 3. Consultar flota
curl "http://localhost:3002/api/asignaciones/usuario/550e8400-e29b-41d4-a716-446655440000"

# Respuesta enriquecida con:
# - Información del usuario (nombre, email, estado)
# - Detalles de vehículos (tipo, categoría, marca, modelo)
```

---

## 🔍 Diferencia Entre Endpoints

### Sin Enriquecimiento
```
GET /api/asignaciones/usuario/{userId}?enriched=false
Response: [{ userId, vehicleId, isActive, ... }]
```

### Con Enriquecimiento (Default)
```
GET /api/asignaciones/usuario/{userId}?enriched=true
Response: [{
  userId, vehicleId, isActive,
  vehicle: { id, type, category, brand, model },
  user: { id, nombre, email, activo }
}]
```

---

## ⚠️ Manejo de Fallos

### Si un servicio no está disponible

```typescript
// Validación fallida
POST /api/asignaciones
  ├─ Si Personas no responde:
  │  └─ BadRequestException: "No se puede validar usuario"
  ├─ Si Vehículos no responde:
  │  └─ BadRequestException: "No se puede validar vehículo"
  └─ Si ambos fallan:
     └─ Error 503 Service Unavailable

// Health Check
GET /api/asignaciones/health
  └─ Status: "DEGRADED" (si alguno falla)
     Services: { vehiculos: "DOWN", personas: "UP", zonas: "DOWN" }
```

### Enriquecimiento Tolerante

```typescript
// Si VehiculoService falla al obtener detalles:
GET /api/asignaciones/usuario/{userId}
  ├─ Devuelve asignaciones
  └─ vehicle: null (si no se pudo obtener)

// Respuesta parcial:
[{
  userId: "...",
  vehicleId: "...",
  vehicle: null,  // No se pudo enriquecer
  user: { ... }   // Datos de usuario sí disponibles
}]
```

---

## 📊 Tabla de Dependencias

| Operación | Vehículos | Personas | Zonas |
|-----------|-----------|----------|-------|
| Crear Asignación | ✅ Requerido | ✅ Requerido | ❌ Opcional |
| Consultar Flota | ✅ Enriquecimiento | ✅ Enriquecimiento | ❌ Opcional |
| Revocar | ❌ No | ❌ No | ❌ No |
| Health Check | ✅ | ✅ | ✅ |

---

## 🔐 Consideraciones de Seguridad

- Los microservicios se comunican internamente (red privada de Docker)
- No hay validación de JWT entre servicios (usar en entorno seguro)
- Errores no exponen información sensible de otros servicios
- Timeouts en todas las llamadas HTTP (5 segundos default)

---

**Última actualización:** 2024-06-24
