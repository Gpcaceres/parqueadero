# 🎫 Instrucciones de Instalación - MS-Tickets

## ✅ Verificación del Microservicio Creado

El microservicio `ms-tickets` ha sido completamente implementado en:
```
C:\Users\patri\OneDrive\Escritorio\Parqueadero\ms-tickets
```

## 📋 Estructura Creada

✅ **Archivos de Configuración:**
- `package.json` - Dependencias y scripts
- `tsconfig.json` - Configuración TypeScript
- `nest-cli.json` - Configuración NestJS
- `.env` - Variables de entorno
- `.gitignore` - Archivos ignorados
- `.prettierrc` - Formateo de código
- `Dockerfile` - Containerización

✅ **Código Fuente:**
- `src/main.ts` - Punto de entrada
- `src/app.module.ts` - Módulo principal
- `src/app.controller.ts` - Controlador raíz
- `src/app.service.ts` - Servicio raíz
- `src/tickets/tickets.module.ts` - Módulo de tickets
- `src/tickets/tickets.controller.ts` - Controlador de tickets
- `src/tickets/tickets.service.ts` - Lógica de negocio
- `src/tickets/entities/ticket.entity.ts` - Modelo de BD
- `src/tickets/dto/*.ts` - DTOs (Create, Update, Response)

✅ **Documentación:**
- `README.md` - Documentación del servicio

## 🚀 Próximos Pasos

### 1. Instalar Dependencias
```bash
cd C:\Users\patri\OneDrive\Escritorio\Parqueadero\ms-tickets
npm install
```

### 2. Iniciar con Docker Compose (Recomendado)
Desde la carpeta raíz de Parqueadero:

```bash
cd C:\Users\patri\OneDrive\Escritorio\Parqueadero

# Levantar todos los servicios (incluyendo ms-tickets)
docker-compose up

# O solo levantar ms-tickets + BD
docker-compose up postgres ms-tickets
```

### 3. Desarrollo Local (Sin Docker)
```bash
# Terminal 1 - Iniciar BD PostgreSQL
# (Asegúrate de tener PostgreSQL corriendo en puerto 5432)

# Terminal 2 - Iniciar ms-tickets
cd ms-tickets
npm run start:dev
```

## 📡 Acceso a la API

### URLs Disponibles:

**Directamente en el microservicio:**
```
http://localhost:3003/
http://localhost:3003/swagger     # Documentación API
http://localhost:3003/health      # Health check
```

**A través de Kong Gateway:**
```
http://localhost:8000/tickets
```

## 🧪 Verificar que Funciona

### Health Check
```bash
curl http://localhost:3003/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "service": "ms-tickets",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Crear un Ticket
```bash
curl -X POST http://localhost:3003/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "id_espacio": "550e8400-e29b-41d4-a716-446655440000",
    "id_usuario": "550e8400-e29b-41d4-a716-446655440001",
    "id_vehiculo": "ABC-123",
    "tipo_vehiculo": "auto",
    "fecha_hora_ingreso": "2024-01-15T10:30:00Z"
  }'
```

### Obtener Todos los Tickets
```bash
curl http://localhost:3003/tickets
```

### Obtener Estadísticas
```bash
curl http://localhost:3003/tickets/estadisticas
```

## 🔌 Cambios Realizados en el Proyecto

### 1. docker-compose.yml
✅ Agregado servicio `ms-tickets` en puerto 3003
✅ Configuración de variables de entorno
✅ Health check configurado
✅ Dependencia de PostgreSQL
✅ Red compartida: `parqueadero-network`

### 2. init.sql
✅ Agregada línea: `CREATE DATABASE tickets_db;`

### 3. kong-gateway/setup-kong.sh
✅ Agregado registro del servicio `tickets-service`
✅ Agregada ruta `/tickets` en Kong
✅ Agregado CORS al servicio de tickets
✅ Actualizado mensaje de información con tickets

## 📊 Campos de la Entidad Ticket

```typescript
{
  id_ticket: number;              // ID único del ticket
  id_espacio: uuid;               // Referencia al espacio de estacionamiento
  id_usuario: uuid;               // Referencia al usuario que ingresa el vehículo
  id_vehiculo: string;            // CC o placa del vehículo
  tipo_vehiculo: string;          // auto, camioneta, motocicleta
  fecha_hora_ingreso: Date;       // Hora de entrada
  fecha_hora_salida?: Date;       // Hora de salida (opcional)
  estado_ticket: enum;            // activo | pagado | anulado
  id_empleado?: uuid;             // Empleado que registra la sesión
  valor_recaudado?: number;       // Valor a cobrar
  created_at: Date;               // Timestamp de creación
  updated_at: Date;               // Timestamp de actualización
}
```

## 🔗 Integración con Otros Microservicios

El servicio está configurado para comunicarse con:
- **Vehículos** (puerto 3000) - `VEHICLE_SERVICE_URL`
- **Personas** (puerto 3001) - `USER_SERVICE_URL`
- **Zonas** (puerto 8080) - `ZONE_SERVICE_URL`

Variables configurables en `.env`

## 🛠️ Comandos Útiles

```bash
# Compilar
npm run build

# Formato de código
npm run format

# Linting
npm run lint

# Testing
npm run test
npm run test:watch
npm run test:cov

# Docker
docker-compose up -d              # En background
docker-compose down               # Detener servicios
docker-compose logs ms-tickets    # Ver logs
docker-compose exec ms-tickets npm run lint  # Ejecutar comando dentro del contenedor
```

## ✨ Características del Microservicio

✅ **CRUD Completo** - Crear, Leer, Actualizar, Eliminar tickets
✅ **Validaciones** - DTOs con validaciones automáticas
✅ **Estados** - Gestión de estado (activo, pagado, anulado)
✅ **Registros** - Entrada/salida de vehículos
✅ **Estadísticas** - Resumen de tickets y recaudos
✅ **Health Check** - Endpoint de disponibilidad
✅ **Swagger** - Documentación automática
✅ **TypeORM** - ORM robusto para BD
✅ **Error Handling** - Manejo de errores consistente
✅ **CORS** - Habilitado en Kong Gateway
✅ **Docker** - Containerizado y listo para producción

## 🐛 Troubleshooting

### Si el servicio no inicia
1. Verificar que PostgreSQL está corriendo
2. Verificar que el puerto 3003 está disponible
3. Verificar variables de entorno en `.env`
4. Revisar logs: `docker-compose logs ms-tickets`

### Si no conecta a BD
1. Asegurar que `init.sql` creó `tickets_db`
2. Verificar credenciales en `.env`
3. Reiniciar PostgreSQL: `docker-compose restart postgres`

### Si Kong no encuentra el servicio
1. Ejecutar manualmente: `docker-compose exec kong kong-setup bash /setup.sh`
2. Verificar en Admin: `http://localhost:8001`

## 📞 Soporte

Para más detalles, consultar:
- `ms-tickets/README.md` - Documentación del servicio
- `docker-compose.yml` - Configuración de servicios
- Swagger UI: `http://localhost:3003/swagger`

---

**¡Microservicio listo para usar! 🚀**
