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
| `ms-tickets` | Jest | 2 suites falladas / 1 pasada (2/2 tests que sí corrían) | **3/3 suites, 19/19 tests** | ✅ Corregido (+4 tests nuevos: recibo PDF, filtro por fecha, reporte) |
| `ms-audit` | Jest | 1/1 suite (solo smoke test, 0% de la lógica real) | **3/3 suites, 9/9 tests** (+2 archivos de test nuevos) | ✅ Ampliado |
| `asignacion-trazabilidad` | Jest | No corría (conflicto de configuración) | **1/1 suite, 8/8 tests** | ✅ Corregido |
| `zonas` | JUnit 5 + Mockito | 1 smoke test (`contextLoads`), sin lógica de negocio probada | **6/6 tests nuevos** de `EspacioServicioImplTest` (el smoke test preexistente sigue fallando, ver nota) | ✅ Ampliado |

**Total: 53 pruebas unitarias pasando** (antes: 5 de ~15 pasaban realmente, y dos servicios ni siquiera lograban ejecutar sus suites).

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

### D1 — `vehiculos`: payload inválido producía `HTTP 500` en vez de `400` ✅ **Corregido**

**Severidad:** Media → Resuelta
**Dónde:** `back-end/vehiculos/src/vehiculos/dto/create-vehiculo.dto.ts`, `back-end/vehiculos/src/main.ts`

**Causa raíz (dos problemas, no uno):**
1. `CreateVehiculoDto.datos` estaba anotado solo con `@ValidateNested()` y `@Type(...)`, sin `@IsDefined()` — un `datos` ausente no lo rechaza `@ValidateNested` (no valida un objeto anidado que no existe).
2. Más grave: **`vehiculos` era el único de los 6 microservicios sin `ValidationPipe` global registrado** en `main.ts` (los otros 5 sí lo tienen). Esto significaba que **ningún** decorador de `class-validator` de `CreateVehiculoDto` se ejecutaba nunca en tiempo de ejecución (ni el formato de placa, ni los rangos de año/capacidad, ni nada) — el payload llegaba crudo al controller sin ninguna validación real, y `VehiculosService.createVehiculo` leía `createVehiculoDto.datos.placa` directamente, lanzando un `TypeError` no capturado que Nest traducía en `HTTP 500`.

**Reproducción (antes del fix):**
```bash
curl -X POST http://localhost:8000/vehiculos -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-admin>" \
  -d '{"tipo":"Auto","placa":"TST-9001", ...}'   # "datos" faltante/mal anidado
# -> HTTP 500 {"statusCode":500,"message":"Internal server error"}
```

**Corrección aplicada:**
1. `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` agregado a `main.ts` (mismo patrón ya usado en `ms-tickets`/`personas`/`ms-audit`/`asignacion-trazabilidad`). `transform: true` es además condición necesaria para que `@Type()` instancie `AutoDto`/`MotocicletaDto`/`CamionetaDto` según `tipo` — sin `ValidationPipe`, esa lógica de discriminación tampoco se ejecutaba nunca.
2. `@IsDefined()` agregado sobre `datos` en `CreateVehiculoDto`, como defensa explícita además de la activación del pipe.

**Verificación tras el fix** (contra el clúster real, imagen reconstruida y redesplegada):
```bash
# Payload malformado -> ahora 400 con mensaje claro
curl -X POST http://localhost:8000/vehiculos ... -d '{"tipo":"Auto","placa":"TST-9001"}'
# -> HTTP 400 {"message":["property placa should not exist","...","El campo \"datos\"... es obligatorio"],"error":"Bad Request"}

# Payload correcto -> sigue funcionando
curl -X POST http://localhost:8000/vehiculos ... -d '{"tipo":"Auto","datos":{"placa":"TST-9010",...}}'
# -> HTTP 201, vehículo creado
```
Suite de tests de `vehiculos` (3/3) re-ejecutada tras el cambio: sigue en verde.

### D2 — `personas`: validación de cédula ecuatoriana funciona correctamente (no es un defecto, se documenta como hallazgo positivo)

Al probar la creación de una persona con un DNI arbitrario (`9999999999`), la API respondió correctamente `HTTP 400` con el mensaje `"El número de cédula ecuatoriana no es válido"`. Esto confirma que el validador personalizado (`EsCedulaValidaConstraint`, algoritmo módulo 10 oficial del Registro Civil ecuatoriano) funciona como se espera. Se documenta aquí porque inicialmente se interpretó como un bloqueo de la prueba, pero al usar una cédula con dígito verificador válido (`1712345675`, generada con el mismo algoritmo) la creación se completó sin problemas.

---

## 4.1 Funcionalidad nueva: recibo en PDF al registrar la salida

Se agregó la generación de un recibo en PDF en `ms-tickets`, ofrecido automáticamente en el frontend apenas se confirma la salida de un vehículo.

- **`GET /tickets/:id/recibo`** (nuevo): genera el PDF al vuelo (no se almacena) con `pdfkit`, enriquecido con el código del espacio (`ZoneIntegrationService.obtenerCodigo`, nuevo) y el nombre del cliente (`PersonaIntegrationService.obtenerNombreCompleto`, ya existente). Incluye: ticket, espacio, vehículo, cliente, fecha de ingreso/salida, duración, tipo de tarifa y el monto (pagado si ya hay salida, "en curso" si el ticket sigue activo).
- **Frontend**: `ticket-modal.js#registrarSalida` abre el PDF en una pestaña nueva apenas se confirma la salida; además se agregó un botón **"Recibo"** en la tabla de Tickets para reimprimir el de cualquier ticket, sin importar su estado.

**Prueba realizada** (contra el clúster real, `parqueadero-caceres`): se creó un ticket, se registró su salida, y se descargó el PDF vía `curl` a través de Kong.

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="recibo-41f3c93b.pdf"
```

Contenido extraído del PDF (`pdftotext -enc UTF-8`), confirmando datos correctos y acentos bien codificados:
```
RECIBO DE PARQUEADERO
Parqueadero ESPE - Sistema Inteligente de Gestión
Ticket: 41f3c93b-... Espacio: ZON3-4 Vehículo: REC-0001 (Auto) Cliente: Test Informe
Ingreso: 27/7/2026, 00:49:22 Salida: 27/7/2026, 00:49:24 Duración: 00:00:02 Tarifa: Por hora o fracción
TOTAL PAGADO
$0.50
```

Se agregó `tickets.controller.spec.ts` → `describe('recibo')`: verifica que el endpoint arma un `StreamableFile` con `type: application/pdf` y el nombre de archivo esperado (suite completa: 15/15).

---

## 4.2 Funcionalidad nueva: filtro de tickets por fecha y reporte PDF consolidado

Se agregó a la sección "Todos los tickets" (vista de empleados) un filtro por rango de fechas y la generación de un reporte en PDF de ese mismo rango.

- **`TicketsService.findAll(desde?, hasta?)`**: ahora filtra por `fecha_hora_ingreso` usando `Between`/`MoreThanOrEqual`/`LessThanOrEqual` de TypeORM; `hasta` se lleva al final del día (`23:59:59.999`) para incluir todo lo ocurrido ese día. `GET /tickets` acepta `?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` opcionales (sin filtro si no se envían, compatible con el comportamiento anterior).
- **`GET /tickets/reporte?desde=...&hasta=...`** (nuevo, ambos parámetros obligatorios → `400` si falta alguno): genera un PDF con la tabla de tickets del período (espacio, vehículo, ingreso, salida, tarifa, estado, recaudado) y un resumen (total de tickets, conteo por estado, total recaudado). Resuelve el código de cada espacio con una sola llamada por espacio **único** en el rango, no una por ticket, para no multiplicar peticiones a `zonas` en reportes grandes.
- **Frontend**: dos campos de fecha + botones "Filtrar"/"Quitar filtro" (recargan la tabla), y un botón "Generar reporte PDF" que se habilita solo cuando ambas fechas están elegidas.

### Defectos de layout encontrados y corregidos mediante verificación visual

La extracción de texto (`pdftotext`) del primer PDF de prueba no mostraba señales claras de error, pero **al rasterizar el PDF a imagen y revisarlo visualmente** (`pdftoppm` + inspección de la imagen) aparecieron dos defectos reales en `ReciboService.generarReportePdf`, ambos causados por un malentendido sobre el manejo del cursor de `pdfkit`:

1. **Encabezado de la tabla invisible**: `doc.rect(...).fill(...)` dibuja el rectángulo pero, a diferencia de `doc.text()`, **no avanza `doc.y`** — el texto blanco del encabezado se calculaba con un `doc.y` que ya no correspondía a la posición del rectángulo recién dibujado, quedando fuera de él (blanco sobre blanco, invisible). Corregido guardando la posición **antes** de dibujar el rectángulo y avanzando el cursor a mano después.
2. **Resumen final cortado en líneas de 4-5 caracteres** ("Total de" / "tickets: 3", "Total rec" / "audado:" / "$1.50"): `doc.x` quedaba heredado de la última celda de la tabla (columna "Recaudado", `x=500`), así que el ancho de ajuste de línea por defecto de la siguiente llamada `doc.text()` sin posición explícita se calculaba como `595 - 500 - 40 ≈ 55pt` (el ancho real de esa columna), en vez del ancho completo de la página. Corregido reseteando `doc.x = 40` explícitamente antes de dibujar el resumen.

Ambos se confirmaron corregidos rasterizando el PDF de nuevo tras el fix y comparando visualmente (antes/después). Esto refuerza que, para features que generan documentos, la verificación con `curl` + validar el `Content-Type`/tamaño del archivo **no alcanza** — hace falta inspeccionar el contenido renderizado real.

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

El sistema cumple funcionalmente con los 7 puntos solicitados. El trabajo de esta ronda de pruebas encontró y corrigió una **deuda técnica real y no trivial** en el arnés de pruebas automatizadas (3 de 6 servicios no lograban ni siquiera ejecutar sus suites por deriva entre tests y código), amplió la cobertura donde no existía ninguna (`ms-audit`, `zonas`), y validó mediante pruebas manuales contra el clúster real que los flujos de negocio críticos —autenticación, autorización por rol, ciclo de vida de tickets, reservas, auditoría vía RabbitMQ, eventos en vivo vía SSE, y auto-recuperación de Kubernetes— funcionan correctamente de punta a punta. Se encontró y **corrigió** un defecto real de validación de entrada (D1: `vehiculos` era el único microservicio sin `ValidationPipe` global, dejando inertes todos sus decoradores de `class-validator`), verificado en vivo contra el clúster tras reconstruir y redesplegar la imagen.
