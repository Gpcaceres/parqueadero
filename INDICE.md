# 📚 Índice Completo - Parqueadero

Guía de todos los archivos y documentación del proyecto.

## 🚀 INICIO RÁPIDO

### Para Compilar y Ejecutar
1. **BUILD.bat** - Reconstrucción simple y rápida
2. **SOLUCION_COMPLETA.bat** - Reconstrucción con validación completa
3. **COMANDOS_MANUALES.txt** - Comandos para ejecutar manualmente

## 📖 DOCUMENTACIÓN PRINCIPAL

### Setup y Configuración
- **DOCKER_COMPOSE_GUIDE.md** - Guía de Docker Compose
- **FIX_DOCKER_NETWORK.md** - Solucionar problemas de red en Docker
- **REPARACION_FINAL.md** - Resumen de reparaciones de versiones
- **VERSIONES_CORRECTAS.md** - Versiones correctas de dependencias

### Microservicios
- **README.md** (raíz) - Overview del proyecto

#### ms-tickets
- **ms-tickets/README.md** - Documentación del microservicio de tickets
- **INSTRUCCIONES_MS_TICKETS.md** - Guía de instalación de ms-tickets

#### personas
- **personas/README.md** - Documentación del microservicio de personas
- **personas/AUTH_IMPLEMENTATION.md** - Implementación de JWT + bcrypt
- **personas/EJEMPLOS_AUTENTICACION.md** - Ejemplos de uso (cURL, JS, React)
- **personas/ROLES_PERMISOS.md** - Sistema de roles y permisos
- **personas/Dockerfile** - Contenedor optimizado

## 🧪 TESTS Y PRUEBAS

### Tests API (Carpeta `/tests/`)
- **tests/1-auth.http** - Pruebas de autenticación
- **tests/2-roles.http** - Pruebas de roles y permisos
- **tests/3-tickets.http** - Pruebas de tickets
- **tests/README.md** - Guía para ejecutar tests

### Archivos de Verificación
- **VERIFICAR_ROLES.http** - Verificar configuración de roles

## 🐳 DOCKER Y DEPLOYMENT

### Configuración
- **docker-compose.yml** - Orquestación de todos los servicios
- **docker-compose-sin-kong.yml** - Version sin Kong Gateway
- **init.sql** - Script de inicialización de BD
- **Dockerfile** - En cada microservicio

### Kong Gateway
- **kong-gateway/setup-kong.sh** - Script de configuración de Kong
- **KONG-GATEWAY-SETUP.md** - Documentación de Kong
- **IMPLEMENTACION-KONG-SWAGGER.md** - Integración Swagger

## 📝 RESÚMENES Y GUÍAS

### Visión General
- **RESUMEN_CAMBIOS.md** - Resumen completo de cambios realizados
- **EVALUACION_CUMPLIMIENTO.md** - Evaluación de cumplimiento

### GitHub y Control de Versiones
- **GITHUB_SETUP.md** - Configuración de GitHub
- **.github/workflows/** - Workflows de CI/CD

## 🗂️ ESTRUCTURA DE CARPETAS

```
Parqueadero/
│
├── 📁 ms-tickets/              # Microservicio de tickets (NUEVO)
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── 📁 personas/                # Microservicio de personas (MEJORADO)
│   ├── src/
│   │   ├── auth/              # Nueva carpeta de autenticación
│   │   ├── roles/             # Nueva carpeta de roles
│   │   └── personas/
│   ├── Dockerfile
│   ├── package.json
│   ├── AUTH_IMPLEMENTATION.md
│   ├── EJEMPLOS_AUTENTICACION.md
│   └── ROLES_PERMISOS.md
│
├── 📁 vehiculos/               # Microservicio de vehículos
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── 📁 asignacion-trazabilidad/ # Microservicio de asignación
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── 📁 zonas/                   # Microservicio de zonas (Spring Boot)
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
│
├── 📁 kong-gateway/            # Kong Gateway
│   └── setup-kong.sh
│
├── 📁 tests/                   # Tests y pruebas API
│   ├── 1-auth.http
│   ├── 2-roles.http
│   ├── 3-tickets.http
│   └── README.md
│
├── 📁 asignacion-trazabilidad/ # Asignación de tracking
│
├── 📄 docker-compose.yml       # Orquestación principal
├── 📄 init.sql                 # Inicialización de BD
├── 📄 INDICE.md                # Este archivo
│
└── 📄 Scripts de ejecución
    ├── BUILD.bat
    ├── SOLUCION_COMPLETA.bat
    ├── REINICIAR_DOCKER.bat
    ├── LIMPIAR_Y_RECONSTRUIR.bat
    ├── LIMPIAR_Y_RECONSTRUIR.sh
    └── COMANDOS_MANUALES.txt
```

## 🎯 FLUJO DE TRABAJO

### Desarrollo Local
1. Leer: **README.md** (raíz) - Overview
2. Instalar: **Docker Desktop**
3. Ejecutar: **BUILD.bat** o **docker-compose up --build -d**
4. Esperar: 20-25 minutos
5. Verificar: `docker-compose ps`

### Probar APIs
1. Abrir: **tests/README.md**
2. Abrir archivo .http en VS Code
3. Instalar extensión REST Client
4. Ejecutar requests

### Agregar Funcionalidad
1. Editar código en microservicio
2. Ejecutar: **BUILD.bat**
3. Probar con tests en `/tests/`

### Solucionar Problemas
1. Ver logs: `docker-compose logs <servicio>`
2. Consultar: **FIX_DOCKER_NETWORK.md**
3. Reiniciar: **REINICIAR_DOCKER.bat**

## 📊 ESTADO DEL PROYECTO

### ✅ Implementado

**Microservicios:**
- ✅ ms-tickets (3003) - Tickets CRUD
- ✅ personas (3001) - Autenticación JWT + Roles
- ✅ vehiculos (3000) - Vehículos CRUD
- ✅ asignacion-trazabilidad (3002) - Trazabilidad
- ✅ zonas (8080) - Zonas CRUD
- ✅ Kong Gateway (8000) - Enrutamiento

**Características:**
- ✅ JWT con bcrypt (SHA256)
- ✅ 4 Roles (cliente, admin, recaudador, root)
- ✅ 20+ Permisos granulares
- ✅ CRUD completo en todos los servicios
- ✅ Swagger documentation
- ✅ Health checks
- ✅ Docker optimizado
- ✅ CI/CD ready

### 🚀 URLs Disponibles

```
Kong Gateway:      http://localhost:8000
Kong Manager:      http://localhost:8002
Kong Admin:        http://localhost:8001

APIs:
- Personas:        http://localhost:3001/swagger
- Tickets:         http://localhost:3003/swagger
- Vehículos:       http://localhost:3000/swagger
- Asignación:      http://localhost:3002/swagger
- Zonas:           http://localhost:8080/swagger-ui.html

Base de Datos:
- PostgreSQL:      localhost:5432
  - User: postgres
  - Pass: postgres
```

## 📞 SOPORTE RÁPIDO

### Problema: Docker no inicia
→ Solución: Ejecuta **REINICIAR_DOCKER.bat**

### Problema: Error de dependencias
→ Solución: Consulta **VERSIONES_CORRECTAS.md**

### Problema: Red no funciona
→ Solución: Lee **FIX_DOCKER_NETWORK.md**

### Problema: No puedo probar APIs
→ Solución: Abre **tests/README.md**

## 🔑 Credenciales por Defecto

```
Usuario (cliente): 
  Username: glopez (generado automáticamente)
  Password: Password123! (tuya al registrar)
  Rol: cliente

Admin (si lo necesitas):
  Rol: admin
  (Se asigna manualmente después de registrar)
```

## 📌 Notas Importantes

- **Tokens JWT**: Válidos por 24 horas
- **Passwords**: Hasheadas con bcrypt
- **Usernames**: Generados automáticamente
- **Roles**: Se crean automáticamente al iniciar
- **Base de datos**: PostgreSQL compartida

## 🎓 Para Aprender

### JWT
- `personas/AUTH_IMPLEMENTATION.md`
- `personas/EJEMPLOS_AUTENTICACION.md`

### Roles y Permisos
- `personas/ROLES_PERMISOS.md`
- `tests/2-roles.http`

### API Rest
- `tests/README.md`
- Cada `README.md` de microservicio

---

**Última actualización:** Julio 2026
**Estado:** ✅ Producción Ready
