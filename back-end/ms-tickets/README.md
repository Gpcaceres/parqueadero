# MS-Tickets - Microservicio de Gestión de Tickets

Microservicio NestJS para la gestión integral de tickets de estacionamiento en el sistema de Parqueadero.

## 📋 Características

- ✅ Crear nuevos tickets de estacionamiento
- ✅ Registrar entrada y salida de vehículos
- ✅ Gestión de estados de tickets (activo, pagado, anulado)
- ✅ Cálculo automático de valor recaudado
- ✅ Estadísticas de tickets
- ✅ Validación de espacios disponibles
- ✅ Integración con otros microservicios

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en modo desarrollo
npm run start:dev

# Ejecutar en modo producción
npm run start:prod
```

### Con Docker

```bash
# Desde la carpeta raíz del proyecto Parqueadero
docker-compose up ms-tickets

# Con rebuild
docker-compose up --build ms-tickets
```

## 📡 API Endpoints

### Tickets
- `POST /tickets` - Crear nuevo ticket
- `GET /tickets` - Obtener todos los tickets
- `GET /tickets/:id` - Obtener ticket por ID
- `GET /tickets/espacio/:id_espacio` - Obtener ticket activo de un espacio
- `GET /tickets/usuario/:id_usuario` - Obtener tickets de un usuario
- `PATCH /tickets/:id` - Actualizar ticket
- `PATCH /tickets/:id/salida` - Registrar salida del vehículo
- `PATCH /tickets/:id/anular` - Anular un ticket
- `DELETE /tickets/:id` - Eliminar ticket
- `GET /tickets/estadisticas` - Obtener estadísticas

### Health Check
- `GET /health` - Verificar estado del servicio

## 📊 Estructura de Datos

### Ticket
```typescript
{
  id_ticket: number;
  id_espacio: uuid;
  id_usuario: uuid;
  id_vehiculo: string; // CC o placa
  tipo_vehiculo: string; // auto, camioneta, motocicleta
  fecha_hora_ingreso: Date;
  fecha_hora_salida?: Date;
  estado_ticket: "activo" | "pagado" | "anulado";
  id_empleado?: uuid;
  valor_recaudado?: number;
  created_at: Date;
  updated_at: Date;
}
```

## 🔧 Configuración

Variables de entorno (.env):

```env
# App
NODE_ENV=development
PORT=3003

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=postgres
DB_NOMBRE=tickets_db

# Services
VEHICLE_SERVICE_URL=http://localhost:3000
USER_SERVICE_URL=http://localhost:3001
ZONE_SERVICE_URL=http://localhost:8080
```

## 🗄️ Base de Datos

El servicio usa PostgreSQL compartida con otros microservicios. La base de datos `tickets_db` se crea automáticamente al ejecutar docker-compose.

### Tabla principal: `tickets`
- Campos principales: id_ticket, id_espacio, id_usuario, estado_ticket
- Índices automáticos en campos frecuentemente consultados
- Creación/actualización automática de timestamps

## 🔗 Integración Kong Gateway

El servicio está registrado en Kong Gateway en la ruta:
```
http://localhost:8000/tickets
```

Acceso directo:
```
http://localhost:3003
```

## 📚 Documentación API

Acceder a Swagger en:
```
http://localhost:3003/swagger
```

O a través de Kong:
```
http://localhost:8000/tickets/swagger
```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Modo watch
npm run test:watch

# Coverage
npm run test:cov
```

## 📦 Scripts Disponibles

- `npm run build` - Compilar TypeScript
- `npm run format` - Formatear código
- `npm run lint` - Linting y auto-fix
- `npm run start` - Ejecutar app compilada
- `npm run start:dev` - Modo desarrollo con watch
- `npm run start:debug` - Modo debug
- `npm run start:prod` - Modo producción

## 🏗️ Estructura del Proyecto

```
ms-tickets/
├── src/
│   ├── tickets/
│   │   ├── dto/
│   │   │   ├── create-ticket.dto.ts
│   │   │   ├── update-ticket.dto.ts
│   │   │   └── response-ticket.dto.ts
│   │   ├── entities/
│   │   │   └── ticket.entity.ts
│   │   ├── tickets.controller.ts
│   │   ├── tickets.service.ts
│   │   └── tickets.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Dependencias

- **NestJS**: Framework principal
- **TypeORM**: ORM para base de datos
- **PostgreSQL**: Base de datos
- **Swagger**: Documentación API
- **class-validator**: Validación de DTOs
- **class-transformer**: Transformación de objetos

## 🔒 Validaciones

El servicio incluye validaciones automáticas:
- UUIDs válidos para id_espacio, id_usuario, id_empleado
- Fechas válidas para entrada/salida
- Estados de ticket válidos
- Prevención de duplicados en espacios activos

## 📝 Ejemplo de Uso

### Crear Ticket
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

### Registrar Salida
```bash
curl -X PATCH http://localhost:3003/tickets/1/salida \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_salida": "2024-01-15T14:30:00Z"
  }'
```

## 🐛 Troubleshooting

### Error de conexión a BD
- Verificar que PostgreSQL esté corriendo
- Verificar variables de entorno DB_*
- Verificar que la base de datos `tickets_db` exista

### Puerto ya en uso
- Cambiar PORT en .env
- O liberar el puerto 3003: `lsof -ti:3003 | xargs kill`

### Migration issues
TypeORM sincroniza automáticamente el schema. Si hay problemas:
1. Backup de la BD
2. Eliminar la BD y dejar que se recree
3. Ejecutar migraciones manualmente si es necesario

## 📄 Licencia

UNLICENSED

## 👨‍💻 Autor

Sistema de Parqueadero - 2024
