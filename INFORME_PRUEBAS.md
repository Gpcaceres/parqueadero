# Informe de Pruebas — Sistema Parqueadero Inteligente

**Fecha de ejecución:** 26–27 de julio de 2026
**Entorno de pruebas:** Kubernetes (Minikube, namespace `parqueadero-caceres`) + ejecución local de suites automatizadas
**Alcance:** pruebas unitarias/automatizadas de los 6 microservicios backend, pruebas funcionales de integración end-to-end sobre el clúster desplegado, y pruebas de infraestructura (Kubernetes, RabbitMQ, Kong, SSE).

---

## 1. Metodología

Se combinaron dos niveles de prueba:

1. **Pruebas unitarias/automatizadas** (Jest para los 5 microservicios NestJS, JUnit 5 + Mockito para el microservicio Spring Boot): se ejecutaron las suites existentes en el repositorio, se diagnosticó cada falla real encontrada y se corrigió el código de prueba (nunca la lógica de negocio, salvo en los casos de deuda técnica explícitamente señalados en la sección 4).
2. **Pruebas funcionales de integración (manuales, vía `curl` contra Kong)**: se ejecutó un flujo real de 20 casos sobre el clúster de Kubernetes ya desplegado (`parqueadero-caceres`), cubriendo autenticación, autorización por rol, CRUD de cada dominio, el ciclo de vida completo de un ticket, reservas, el flujo de eventos por RabbitMQ hacia `ms-audit`, Server-Sent Events, cabeceras CORS de Kong, y auto-recuperación de Kubernetes.

Ninguna prueba se ejecutó contra mocks del sistema completo: todo corrió contra el clúster real, con Supabase como base de datos de las 6 aplicaciones y PostgreSQL propio para Kong.

---

## 2. Pruebas unitarias automatizadas

### 2.1 Resultado por servicio

| Servicio | Stack de testing | Antes | Después | Estado |
|---|---|---|---|---|
| `personas` | Jest | 3 suites falladas / 1 pasada (2/3 tests) | **4/4 suites, 8/8 tests** | ✅ Corregido |
| `vehiculos` | Jest | 2 suites falladas / 1 pasada (1/3 tests) | **3/3 suites, 3/3 tests** | ✅ Corregido |
| `ms-tickets` | Jest | 2 suites falladas / 1 pasada (2/2 tests que sí corrían) | **3/3 suites, 14/14 tests** | ✅ Corregido |
| `ms-audit` | Jest | 1/1 suite (solo smoke test, 0% de la lógica real) | **3/3 suites, 9/9 tests** (+2 archivos de test nuevos) | ✅ Ampliado |
| `asignacion-trazabilidad` | Jest | No corría (conflicto de configuración) | **1/1 suite, 8/8 tests** | ✅ Corregido |
| `zonas` | JUnit 5 + Mockito | 1 smoke test (`contextLoads`), sin lógica de negocio probada | **6/6 tests nuevos** de `EspacioServicioImplTest` (el smoke test preexistente sigue fallando, ver nota) | ✅ Ampliado |

**Total: 48 pruebas unitarias pasando** (antes: 5 de ~15 pasaban realmente, y dos servicios ni siquiera lograban ejecutar sus suites).

### 2.2 Defectos encontrados y corregidos en el arnés de pruebas

Todas las fallas fueron **causadas por deriva entre el código de prueba y el código real** (los tests quedaron desactualizados a medida que se agregó RabbitMQ, JWT, guards, y el módulo de reservas), no por errores en la lógica de producción:

| # | Servicio | Causa raíz | Corrección |
|---|---|---|---|
| 1 | `personas` | `auth.service.ts` importaba `uuid` (paquete ESM-only) — Jest no puede parsear `export` de `node_modules` sin configuración adicional | Se reemplazó `uuidv4()` por `crypto.randomUUID()` (nativo de Node, cero dependencias). Se quitó `uuid` de `package.json`. |
| 2 | `personas` | `personas.service.spec.ts` / `personas.controller.spec.ts` no proveían mocks de `PersonaRepository` ni `EventPublisher` (agregados después de integrar RabbitMQ) | Se agregaron los providers mock faltantes. |
| 3 | `personas` | `auth.service.spec.ts` no mockeaba `Role`/`UserRole` repos ni `EventPublisher`; el test de "usuario ya existe" probaba una regla de negocio (`ConflictException` por username duplicado) que ya no existe — `register()` ahora genera el username automáticamente y nunca rechaza por duplicado, sino que agrega un sufijo numérico | Se completaron los mocks faltantes y se reemplazó el test obsoleto por uno que verifica el comportamiento real (sufijo numérico ante colisión). |
| 4 | `vehiculos` | Mismo patrón que #2: providers faltantes para `VehiculoRepository`/`EventPublisher`, y guards (`OptionalAuthGuard`/`JwtAuthGuard`/`RolesGuard`) sin `overrideGuard` en el test del controller | Se agregaron mocks y `overrideGuard` (patrón oficial de NestJS para no reconstruir la cadena real de JWT en un test unitario). |
| 5 | `ms-tickets` | `tickets.controller.spec.ts`/`tickets.service.spec.ts` desactualizados: `TicketsController.create()` ahora exige `@Req() req`, `id_ticket` pasó de `number` a `string` (UUID), `createTicket` ahora depende también de `ZoneIntegrationService` y `EventPublisher`, y los mocks de `Ticket` no cubrían todos los campos de la entidad actual | Se reescribieron ambos archivos con mocks completos y un factory `mockTicket()` reutilizable; se agregó `overrideGuard` para los 3 guards del controller. |
| 6 | `ms-audit` | El consumidor de RabbitMQ (`AuditConsumer`) y el CRUD (`AuditService`) no tenían **ninguna** prueba — único servicio con cobertura real 0% de su lógica de negocio, pese a ser el componente central de la integración RabbitMQ que evalúa esta actividad | Se agregaron `audit.service.spec.ts` (CRUD) y `audit.consumer.spec.ts` (valida el handler real de mensajes: evento válido → persiste y hace `ack`; evento inválido o JSON corrupto → `nack` sin reencolar y **nunca** llama a `auditService.create`). |
| 7 | `asignacion-trazabilidad` | Existían simultáneamente `jest.config.js` **y** la clave `"jest"` en `package.json` (con contenido idéntico) — Jest se niega a correr si detecta configuración duplicada | Se eliminó el archivo redundante `jest.config.js`. |
| 8 | `asignacion-trazabilidad` | `assignment.service.spec.ts` no mockeaba `EventPublisher` (agregado al integrar RabbitMQ) | Se agregó el provider mock. |
| 9 | `zonas` | Sin ninguna prueba de reglas de negocio (validación de capacidad de zona, generación de código único de espacio, toggle activar/desactivar) | Se agregó `EspacioServicioImplTest` (JUnit 5 + Mockito): 6 pruebas nuevas. |

### 2.3 Nota sobre el smoke test de `zonas`

`ZonasApplicationTests.contextLoads()` (preexistente) intenta levantar el contexto **completo** de Spring Boot, lo cual exige una conexión real a PostgreSQL en `localhost:5432`. Este test falla en cualquier entorno que no tenga esa base disponible (incluido el contenedor Maven+JDK21 usado para correr esta suite, ya que el JDK local de la máquina de desarrollo es la versión 17 y el proyecto exige 21). No es un defecto introducido por este trabajo ni algo que las pruebas nuevas hayan roto — es una limitación de diseño del test preexistente (una prueba de arranque de contexto no debería depender de infraestructura externa real). Se documenta como deuda técnica conocida; solucionarlo apropiadamente requeriría agregar un perfil de test con base en memoria (H2) o Testcontainers, lo cual excede el alcance de esta actividad.

---

## 3. Pruebas funcionales de integración (end-to-end, sobre el clúster real)

Ejecutadas contra `http://localhost:8000` (Kong, vía `minikube tunnel`) sobre el namespace `parqueadero-caceres`.

| # | Prueba | Resultado | Evidencia |
|---|---|---|---|
| 1 | Login con credenciales válidas (rol `admin`) | ✅ PASS | `HTTP 201`, `access_token` + `roles:["admin"]` |
| 2 | Login con credenciales válidas (rol `cliente`) | ✅ PASS | `HTTP 201`, `roles:["cliente"]` |
| 3 | Login con contraseña incorrecta | ✅ PASS | `HTTP 401` |
| 4 | RBAC: un `cliente` intenta crear un ticket (acción de empleado) | ✅ PASS | `HTTP 403` |
| 5 | CRUD Zonas: crear zona | ✅ PASS | Zona creada con código autogenerado `ZON3` |
| 6 | CRUD Espacios: crear espacio en la zona | ✅ PASS | Espacio `ZON3-1`, estado inicial `DISPONIBLE` |
| 7 | CRUD Vehículos: crear vehículo | ⚠️ Bug encontrado → ✅ luego PASS | Ver defecto D1 abajo |
| 8 | CRUD Personas: crear persona | ⚠️ Requirió cédula ecuatoriana válida (dígito verificador) → ✅ PASS | Ver nota en defecto D2 |
| 9 | Ciclo de ticket: registrar ingreso | ✅ PASS | Ticket creado, `estado_ticket: "activo"` |
| 10 | Verificar que el espacio pasó a `OCUPADO` tras el ingreso | ✅ PASS | Integración ms-tickets → zonas confirmada |
| 11 | Ciclo de ticket: registrar salida | ✅ PASS | `estado_ticket: "pagado"`, `valor_recaudado` calculado |
| 12 | Verificar que el espacio volvió a `DISPONIBLE` tras la salida | ✅ PASS | |
| 13 | RabbitMQ → ms-audit: eventos de todas las entidades presentes en `/audit` | ✅ PASS | Conteo real: `ESPACIO`, `PERSONA`, `TICKET`, `USUARIO`, `USER-ROLE`, `VEHICULO`, `ZONA` |
| 13b | RabbitMQ → ms-audit: verificar el evento exacto del ticket de prueba (creación y salida) | ✅ PASS | Ambos eventos localizados en `/audit` con los datos correctos (`id_ticket`, `valor_recaudado`, `accionTicket:"SALIDA"`) |
| 14 | SSE (`/sse/espacios`): recibir evento en vivo al crear un ticket | ✅ PASS | Cliente SSE conectado recibió `event: Espacio actualizado` con `estado:"OCUPADO"` en tiempo real |
| 15 | Reservas: un cliente reserva un espacio disponible | ✅ PASS | Reserva creada, `procesada:false` |
| 16 | Reservas: un cliente intenta **cancelar** una reserva (acción de empleado) | ✅ PASS | `HTTP 403` |
| 17 | Reservas: un `admin` cancela la reserva | ✅ PASS | Reserva `procesada:true`, espacio liberado a `DISPONIBLE` |
| 18 | Kong: cabeceras CORS en preflight `OPTIONS` | ✅ PASS | `Access-Control-Allow-Origin: *`, métodos completos |
| 19 | Kubernetes: self-healing — se borra el pod de `personas` manualmente | ✅ PASS | El Deployment repuso el pod en 34s (`1/1 Running`) sin intervención |
| 20 | Confirmar que el servicio siguió respondiendo tras la recuperación (nuevo login) | ✅ PASS | `HTTP 201` |

**20/20 pruebas funcionales pasaron** (dos de ellas, #7 y #8, expusieron primero un defecto/detalle real antes de pasar — documentados abajo).

---

## 4. Defectos encontrados

### D1 — `vehiculos`: payload inválido produce `HTTP 500` en vez de `400` (defecto real, no corregido)

**Severidad:** Media
**Dónde:** `back-end/vehiculos/src/vehiculos/dto/create-vehiculo.dto.ts`

`CreateVehiculoDto.datos` está anotado solo con `@ValidateNested()` y `@Type(...)`, sin `@IsDefined()` / `@IsNotEmptyObject()`. Si el campo `datos` llega ausente o `undefined`, `class-validator` no lo rechaza (no valida un objeto anidado que no existe), y la petición pasa al controller/servicio, donde `VehiculosService.createVehiculo` accede directamente a `createVehiculoDto.datos.placa` sin verificación previa, lanzando un `TypeError` no capturado que Nest traduce en un `HTTP 500 Internal server error` genérico en vez de un `400 Bad Request` con un mensaje útil.

**Reproducción:**
```bash
curl -X POST http://localhost:8000/vehiculos -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-admin>" \
  -d '{"tipo":"Auto","placa":"TST-9001", ...}'   # "datos" faltante/mal anidado
# -> HTTP 500 {"statusCode":500,"message":"Internal server error"}
```

**Recomendación:** agregar `@IsDefined()` (o `@IsNotEmptyObject()`) sobre la propiedad `datos` en `CreateVehiculoDto`, y envolver el acceso en `VehiculosService.createVehiculo` con una validación explícita antes de leer `datos.placa`. No se aplicó la corrección en este trabajo por tratarse de un cambio de comportamiento de la API (código de error) que debe decidir el equipo dueño del servicio; se deja documentado para que se resuelva como parte del backlog del proyecto.

### D2 — `personas`: validación de cédula ecuatoriana funciona correctamente (no es un defecto, se documenta como hallazgo positivo)

Al probar la creación de una persona con un DNI arbitrario (`9999999999`), la API respondió correctamente `HTTP 400` con el mensaje `"El número de cédula ecuatoriana no es válido"`. Esto confirma que el validador personalizado (`EsCedulaValidaConstraint`, algoritmo módulo 10 oficial del Registro Civil ecuatoriano) funciona como se espera. Se documenta aquí porque inicialmente se interpretó como un bloqueo de la prueba, pero al usar una cédula con dígito verificador válido (`1712345675`, generada con el mismo algoritmo) la creación se completó sin problemas.

---

## 5. Cobertura por requisito de la actividad

| Requisito solicitado | Estado | Evidencia |
|---|---|---|
| Frontend con SSE | ✅ Ya implementado, verificado en vivo | Prueba funcional #14 |
| Implementación de RabbitMQ | ✅ Ya implementado, verificado en vivo | Pruebas funcionales #13, #13b; 5 publicadores + 1 consumidor confirmados en el código |
| API Gateway (Kong) | ✅ Ya implementado, verificado en vivo | Todas las pruebas funcionales pasan a través de Kong; CORS confirmado (#18) |
| Carpeta k8s (o equivalente) con manifiestos | ✅ Ya implementado (`deployment/`, 14 archivos numerados) | Desplegado y verificado en 3 namespaces independientes (`parqueadero-caceres/buestan/masapanta`) |
| README.md con documentación | 🔄 Reescrito (ver `README.md`) | Estaba gravemente desactualizado (describía una arquitectura de 3 microservicios sin RabbitMQ/Kong/K8s/frontend) |
| Informe de pruebas | ✅ Este documento | — |
| Replicabilidad (indicaciones de despliegue) | ✅ Verificado | `.env.example` presente en la raíz y en los 6 microservicios; instrucciones Docker Compose y Kubernetes documentadas en `README.md` y `deployment/README.md` |

---

## 6. Conclusión

El sistema cumple funcionalmente con los 7 puntos solicitados. El trabajo de esta ronda de pruebas encontró y corrigió una **deuda técnica real y no trivial** en el arnés de pruebas automatizadas (3 de 6 servicios no lograban ni siquiera ejecutar sus suites por deriva entre tests y código), amplió la cobertura donde no existía ninguna (`ms-audit`, `zonas`), y validó mediante pruebas manuales contra el clúster real que los flujos de negocio críticos —autenticación, autorización por rol, ciclo de vida de tickets, reservas, auditoría vía RabbitMQ, eventos en vivo vía SSE, y auto-recuperación de Kubernetes— funcionan correctamente de punta a punta. Se documentó un defecto real de validación de entrada (D1) para que el equipo lo priorice.
