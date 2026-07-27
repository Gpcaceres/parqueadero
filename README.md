# 🅿️ Parqueadero Inteligente — Sistema Integral de Gestión

**Sistema de microservicios para la gestión de un parqueadero: control de ingreso/salida de vehículos, reservas, zonas y espacios en tiempo real, auditoría centralizada y autenticación por roles — todo detrás de un API Gateway único.**

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Microservicios](#-microservicios)
- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Variables de entorno](#-variables-de-entorno)
- [URLs de acceso](#-urls-de-acceso)
- [Uso básico](#-uso-básico)
- [Testing](#-testing)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Documentación adicional](#-documentación-adicional)

---

## 📖 Descripción

**Parqueadero** permite:

- ✅ Gestionar personas, cuentas de acceso y roles (`admin`, `recaudador`, `root`, `cliente`)
- ✅ Registrar vehículos (autos, motos, camionetas) con datos específicos por tipo
- ✅ Administrar zonas y espacios de estacionamiento, con estado en tiempo real
- ✅ Registrar ingreso/salida de vehículos mediante tickets, con cálculo automático de tarifa (por hora, mensual, nocturna)
- ✅ Reservar un espacio disponible (rol `cliente`) y que el personal confirme la llegada o cancele la reserva
- ✅ Ver el estado de los espacios **actualizándose en vivo** en el dashboard, sin recargar la página (Server-Sent Events)
- ✅ Auditar automáticamente cada creación/modificación/eliminación de cualquier microservicio, de forma asíncrona vía RabbitMQ
- ✅ Acceder a todo a través de un único punto de entrada (Kong API Gateway)
- ✅ Desplegar el sistema completo tanto con Docker Compose (desarrollo/demo rápida) como con Kubernetes (`deployment/`)

---

## 🏗️ Arquitectura

```
                              Navegador (front-end/app)
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   Kong API Gateway        │
                          │   Proxy :8000 · Admin :8001│
                          └─────────────┬─────────────┘
                                        │
        ┌──────────────┬───────────────┼───────────────┬──────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼              ▼
   ┌─────────┐   ┌───────────┐   ┌──────────┐   ┌─────────────┐  ┌─────────┐  ┌────────────┐
   │ personas│   │ vehiculos │   │  zonas   │   │ ms-tickets  │  │ms-audit │  │asignacion- │
   │  :3001  │   │   :3000   │   │  :8080   │   │   :3003     │  │  :3004  │  │trazabilidad│
   │ NestJS  │   │  NestJS   │   │  Spring  │   │   NestJS    │  │ NestJS  │  │   :3002    │
   │  +JWT   │   │           │   │  Boot    │   │ (+SSE, +res.)│  │(consumer)│  │  NestJS   │
   └────┬────┘   └─────┬─────┘   └────┬─────┘   └──────┬──────┘  └────▲────┘  └─────┬──────┘
        │              │              │                │              │             │
        │              │              │  publican eventos (AMQP)      │             │
        └──────────────┴──────────────┴────────────────┴──────────────┴─────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   RabbitMQ (exchange      │
                          │   audit_exchange, topic)  │
                          └──────────────────────────┘

   personas · vehiculos · zonas · ms-tickets · ms-audit · asignacion-trazabilidad
                          │
                          ▼
                  PostgreSQL (Supabase, 1 base por servicio)
```

Kong tiene su propia base de datos PostgreSQL dedicada (no compartida con las aplicaciones). El frontend consume `ms-tickets` vía **SSE** (`/sse/espacios`) para reflejar cambios de estado de los espacios sin polling constante.

---

## 🔧 Microservicios

| Servicio | Stack | Puerto | Responsabilidad |
|---|---|---|---|
| **personas** | NestJS 11 + TypeORM + JWT/Passport + bcrypt | `3001` | Personas, cuentas de usuario, roles, login (`/auth/login`, `/auth/register`) |
| **vehiculos** | NestJS 11 + TypeORM | `3000` | Catálogo de vehículos (Auto/Moto/Camioneta, cada uno con campos propios) |
| **zonas** | Spring Boot 4 (Java 21) + JPA + AMQP | `8080` | Zonas y espacios de estacionamiento, estado (`DISPONIBLE/OCUPADO/RESERVADO/MANTENIMIENTO/INACTIVO`) |
| **ms-tickets** | NestJS 11 + TypeORM + SSE + Scheduler | `3003` | Ingreso/salida/anulación de tickets, cálculo de tarifa, **reservas** de espacios, stream SSE de cambios de espacio |
| **ms-audit** | NestJS 11 + amqplib (consumer) | `3004` | Recibe eventos de auditoría de todos los demás servicios vía RabbitMQ y los persiste |
| **asignacion-trazabilidad** | NestJS 10 + TypeORM | `3002` | Asignación de vehículos a propietarios y trazabilidad de esas asignaciones |
| **Kong** | Kong Gateway 3.0 | `8000` (proxy) / `8001` (admin) | Punto único de entrada; enruta cada path al microservicio correspondiente, agrega CORS |
| **RabbitMQ** | `rabbitmq:3-management` | `5672` (AMQP) / `15672` (UI) | Bus de eventos de auditoría (`audit_exchange`, topic, routing key `audit.event`) |
| **Frontend** | HTML + Tailwind (CDN) + JS vanilla (módulos ES) | servido por Kong/nginx | Dashboard operativo (espacios, tickets, vehículos, zonas, usuarios, auditoría) + login |

> Nota: `asignacion-trazabilidad` quedó en NestJS 10/TypeORM 0.3 mientras el resto migró a NestJS 11/TypeORM 1.0 — es deuda técnica conocida, documentada en `INFORME_PRUEBAS.md`.

---

## ✨ Características

- **Autenticación y roles**: JWT emitido por `personas`, validado por cada microservicio; roles `admin`/`recaudador`/`root` (empleados) vs `cliente`.
- **Tiempo real (SSE)**: `ms-tickets` expone `GET /sse/espacios`; cada vez que un ticket cambia el estado de un espacio, el evento llega al navegador sin recargar ni hacer polling agresivo (hay un polling de respaldo cada 30s por robustez).
- **Auditoría desacoplada (RabbitMQ)**: los 6 microservicios publican eventos (`CREATE`/`UPDATE`/`DELETE`/...) a un exchange topic; `ms-audit` los consume, valida y persiste — si el mensaje es inválido se descarta (`nack`, sin reencolar) para no bloquear la cola.
- **API Gateway (Kong)**: todas las rutas públicas pasan por `localhost:8000`; Kong agrega CORS a los 6 servicios y desactiva el buffering en la ruta `/sse` para que el stream llegue en vivo.
- **Kubernetes listo para producción de prueba**: manifiestos completos en `deployment/`, con `initContainers` esperando dependencias, probes de salud, Secrets separados de la plantilla versionada, y un Job que configura Kong automáticamente al desplegar.
- **Reservas con expiración automática**: un cliente reserva un espacio con al menos 1h de anticipación; si no se presenta 10 minutos después de la hora reservada, el espacio se libera solo (`@Interval` en `ms-tickets`).

---

## 📦 Requisitos

### Opción Docker Compose (recomendada para desarrollo/demo)
- Docker + Docker Compose
- Cuenta de Supabase (o cualquier Postgres accesible) para las 6 bases de datos de aplicación

### Opción Kubernetes
- Minikube (o cualquier clúster de Kubernetes) + kubectl
- Docker (para construir las imágenes)

### Desarrollo manual sin Docker (opcional, por servicio)
- Node.js 20+, npm
- Java 21+, Maven 3.9+ (solo para `zonas`)

---

## 🚀 Instalación y ejecución

### Opción 1 — Docker Compose (todo el stack en un comando)

```bash
git clone <url-del-repositorio>
cd Parqueadero

# 1. Configurar el password de Supabase (usado por las 6 apps)
cp .env.example .env
# Editar .env y completar SUPABASE_DB_PASSWORD

# 2. Levantar todo
docker-compose up -d --build

# 3. Verificar
docker-compose ps
```

Esto levanta: Kong + su Postgres + migración + configuración automática de rutas (`kong-setup`), RabbitMQ, y los 6 microservicios. El frontend se sirve por su propio `front-end/docker-compose.yml` (ver `front-end/`).

Cada microservicio también tiene su propio `.env.example` (`back-end/<servicio>/.env.example`) por si se quiere correr alguno suelto con `npm run start:dev` en vez de Docker.

### Opción 2 — Kubernetes (Minikube)

Instrucciones completas y detalladas en **[`deployment/README.md`](deployment/README.md)**. Resumen:

```bash
minikube start --driver=docker
minikube addons enable ingress

# Generar el Secret real (nunca se versiona con el password real)
kubectl create secret generic parqueadero-secrets -n parqueadero \
  --from-literal=JWT_SECRET="<valor-compartido-con-docker-compose>" \
  --from-literal=SUPABASE_DB_PASSWORD="<password-real-de-supabase>" \
  --dry-run=client -o yaml > deployment/02-secrets.local.yml
kubectl create secret generic kong-db-secret -n parqueadero \
  --from-literal=KONG_PG_PASSWORD="kong123" \
  --dry-run=client -o yaml >> deployment/02-secrets.local.yml

# Construir las 7 imágenes dentro del daemon Docker de Minikube
minikube -p minikube docker-env --shell bash | eval
for s in personas vehiculos zonas ms-tickets ms-audit asignacion-trazabilidad; do
  docker build -t $s:latest ./back-end/$s
done
docker build -t frontend:latest ./front-end

# Aplicar todo en orden
kubectl apply -f deployment/

kubectl get pods -n parqueadero
```

Acceso final: `minikube tunnel` + entrada en el `hosts` (`127.0.0.1 parking.espe.edu.ec`) → `http://parking.espe.edu.ec`.

---

## 🔐 Variables de entorno

| Archivo | Qué documenta |
|---|---|
| `.env.example` (raíz) | `SUPABASE_DB_PASSWORD` — usada por `docker-compose.yml` y por `deployment/02-secrets.yml` |
| `back-end/personas/.env.example` | Conexión a Supabase, RabbitMQ, `JWT_SECRET` |
| `back-end/vehiculos/.env.example` | Conexión a Supabase, RabbitMQ, `JWT_SECRET` |
| `back-end/zonas/.env.example` | Variables `SPRING_DATASOURCE_*`/`SPRING_RABBITMQ_*` (Spring Boot no carga `.env` automáticamente — es documentación de referencia) |
| `back-end/ms-tickets/.env.example` | Conexión a Supabase, RabbitMQ, `JWT_SECRET`, URLs de los otros microservicios |
| `back-end/ms-audit/.env.example` | Conexión a Supabase, RabbitMQ (incluye `RABBITMQ_QUEUE`), `THROTTLE_TTL/LIMIT` |
| `back-end/asignacion-trazabilidad/.env.example` | Conexión a Supabase, RabbitMQ, `JWT_SECRET`, URLs de los otros microservicios |

Todos los `.env.example` están trackeados en git (solo tienen placeholders); los `.env` reales **nunca** se commitean (ver `.gitignore`).

---

## 🌐 URLs de acceso

| Servicio | Docker Compose | Kubernetes (Minikube) |
|---|---|---|
| Frontend | http://localhost (según `front-end/docker-compose.yml`) | http://parking.espe.edu.ec |
| Kong Proxy (toda la API) | http://localhost:8000 | http://localhost:8000 (vía `minikube tunnel`) |
| Kong Admin | http://localhost:8001 | http://localhost:8001 |
| RabbitMQ Management | http://localhost:15672 (guest/guest) | — (no expuesto externamente) |

---

## 📡 Uso básico

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jperez","password":"Clave123*"}'

# Ver espacios (con el token del paso anterior)
curl http://localhost:8000/api/v1/espacios \
  -H "Authorization: Bearer <access_token>"

# Registrar ingreso de un vehículo (rol admin/recaudador/root)
curl -X POST http://localhost:8000/tickets \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"id_espacio":"<uuid>","id_usuario":"<uuid>","id_vehiculo":"ABC-1234","tipo_vehiculo":"Auto","tipo_tarifa":"POR_HORA"}'

# Suscribirse al stream de espacios en tiempo real
curl -N http://localhost:8000/sse/espacios
```

---

## 🧪 Testing

Ver el **[Informe de Pruebas](INFORME_PRUEBAS.md)** completo (unitarias + funcionales end-to-end + defectos encontrados).

```bash
# Cada microservicio Node
cd back-end/<servicio>
npm test          # unitarias
npm run test:cov  # con cobertura

# zonas (Spring Boot, requiere JDK 21)
cd back-end/zonas
mvn test
```

---

## 📁 Estructura del repositorio

```
Parqueadero/
├── back-end/
│   ├── personas/                  # NestJS -- auth, usuarios, roles
│   ├── vehiculos/                 # NestJS -- catálogo de vehículos
│   ├── zonas/                     # Spring Boot -- zonas y espacios
│   ├── ms-tickets/                # NestJS -- tickets, reservas, SSE
│   ├── ms-audit/                  # NestJS -- consumer de auditoría (RabbitMQ)
│   └── asignacion-trazabilidad/   # NestJS -- asignación vehículo-propietario
├── front-end/
│   ├── app/                       # Dashboard + login (Tailwind + JS vanilla)
│   └── docker-compose.yml
├── kong-gateway/
│   └── setup-kong.sh              # Registra servicios/rutas/CORS en Kong
├── deployment/                    # Manifiestos de Kubernetes (14 archivos numerados)
│   └── README.md                  # Guía de despliegue en Minikube
├── docker-compose.yml             # Orquestación completa (Kong, RabbitMQ, 6 microservicios)
├── .env.example
├── INFORME_PRUEBAS.md
└── README.md
```

---

## 📚 Documentación adicional

| Documento | Contenido |
|---|---|
| [`deployment/README.md`](deployment/README.md) | Guía paso a paso de despliegue en Kubernetes/Minikube |
| [`INFORME_PRUEBAS.md`](INFORME_PRUEBAS.md) | Pruebas unitarias y funcionales ejecutadas, defectos encontrados |
| `kong-gateway/setup-kong.sh` | Script real que registra cada ruta y el plugin CORS en Kong |

---

## 👨‍💼 Autor

**Germancin** · ithopc@gmail.com
