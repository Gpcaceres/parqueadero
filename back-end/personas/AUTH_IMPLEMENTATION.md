# 🔐 Autenticación JWT con Cifrado SHA - Microservicio Personas

## Resumen de Implementación

Se ha agregado autenticación JWT con cifrado bcrypt (SHA256) al microservicio personas, permitiendo login, registro y protección de rutas.

## 📦 Dependencias Agregadas

```json
{
  "@nestjs/jwt": "^12.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1"
}
```

## 🏗️ Estructura Creada

```
src/auth/
├── auth.controller.ts          # Endpoints de autenticación
├── auth.service.ts             # Lógica de autenticación
├── auth.module.ts              # Módulo de autenticación
├── dto/
│   ├── login.dto.ts            # DTO para login
│   └── register.dto.ts         # DTO para registro
├── strategies/
│   └── jwt.strategy.ts         # Estrategia JWT
└── guards/
    └── jwt-auth.guard.ts       # Guard para proteger rutas
```

## 🔑 Flujo de Autenticación

### 1. Registro
```
POST /auth/register
Body: {
  username: "galopez11",
  password: "password123",
  firstName: "Guillermo",
  lastName: "López",
  email: "guillermo@example.com",
  phone: "3101234567"
}

Response: {
  access_token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id: "uuid",
    username: "galopez11",
    email: "guillermo@example.com",
    firstName: "Guillermo",
    lastName: "López",
    roles: []
  }
}
```

### 2. Login
```
POST /auth/login
Body: {
  username: "galopez11",
  password: "password123"
}

Response: {
  access_token: "eyJhbGciOiJIUzI1NiIs...",
  user: { ... }
}
```

### 3. Acceder a Rutas Protegidas
```
GET /auth/me
Header: Authorization: Bearer <access_token>

Response: {
  id: "uuid",
  username: "galopez11",
  email: "guillermo@example.com",
  roles: ["user", "admin"]
}
```

## 🔒 Cifrado de Contraseñas

**Algoritmo:** bcrypt con hash SHA256
- **Rounds:** 10 (configurable)
- **Seguridad:** Cada contraseña tiene un salt único
- **Campo BD:** `users.password_hash`

### Ejemplo de Hash
```
Contraseña: "password123"
Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye3Ig2F7GkHsDPzvwq1L1xR3T1lqJCzNm"
```

## 📡 Endpoints

### Públicos (Sin Autenticación)
```
POST /auth/register          # Registrar nuevo usuario
POST /auth/login             # Login de usuario
```

### Protegidos (Con JWT)
```
GET  /auth/me                # Información del usuario actual
GET  /auth/verify            # Verificar validez del token
POST /auth/refresh           # Refrescar token
```

## 🛡️ JWT Payload

```json
{
  "sub": "uuid-del-usuario",
  "username": "galopez11",
  "email": "guillermo@example.com",
  "roles": ["user", "admin"],
  "iat": 1642345678,
  "exp": 1642432078
}
```

**Duración:** 24 horas (configurable en `.env`)

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-with-strong-random-string
JWT_EXPIRES_IN=24h

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=postgres
DB_NOMBRE=personas_db

# Server
PORT=3001
```

### Cambiar Secret en Producción
```bash
# Generar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Actualizar en .env
JWT_SECRET=<generated-secret>
```

## 🔐 Uso con Guards

### Proteger una Ruta
```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('personas')
export class PersonasController {
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    // Solo usuarios autenticados
    return { userId: req.user.id };
  }
}
```

### Proteger Método de Servicio
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
async updateProfile(id: string, data: any) {
  // ...
}
```

## 📊 Base de Datos

### Tabla users (Actualizada)
```sql
CREATE TABLE users (
  id_person UUID PRIMARY KEY,
  username VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

**Cambios principales:**
- Campo `password_hash` almacena el hash bcrypt
- Campo `last_login` registra último acceso
- Campo `active` permite desactivar usuarios

## 🧪 Pruebas

### Con cURL

```bash
# Registro
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "galopez11",
    "password": "password123",
    "firstName": "Guillermo",
    "lastName": "López",
    "email": "guillermo@example.com"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "galopez11",
    "password": "password123"
  }'

# Acceso a ruta protegida
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer <token>"
```

### Con Postman

1. **Crear variable de entorno:** `token`
2. **Endpoint de login:**
   - URL: `http://localhost:3001/auth/login`
   - Body (JSON): `{ "username": "...", "password": "..." }`
   - Tests: `pm.environment.set("token", pm.response.json().access_token)`
3. **Usar en otros endpoints:**
   - Header: `Authorization: Bearer {{token}}`

## 📚 Swagger/OpenAPI

Acceder a `http://localhost:3001/swagger`

**Características:**
- ✅ Documentación de todos los endpoints
- ✅ Esquemas de DTOs
- ✅ Autenticación con Bearer token
- ✅ Prueba directa desde Swagger UI

## 🔄 Renovación de Token

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Authorization: Bearer <token>"

Response: {
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 🚀 Próximos Pasos Recomendados

1. **Proteger más endpoints** en personas con `@UseGuards(JwtAuthGuard)`
2. **Implementar roles y permisos** más granulares
3. **Agregar rate limiting** en endpoints de login
4. **Implementar refresh tokens** de larga duración
5. **Agregar 2FA** si es necesario
6. **Auditoría de logins** fallidos
7. **Validación de email** al registrarse

## ⚠️ Consideraciones de Seguridad

✅ **Implementado:**
- Contraseñas hasheadas con bcrypt
- JWT con firma y expiración
- Validación de tokens
- Validación de DTOs
- Últimos logins registrados

⚠️ **Considerar para Producción:**
- HTTPS obligatorio
- CORS configurado correctamente
- Rate limiting
- Validación de email
- Passwordless authentication
- Monitoreo de intentos fallidos
- Política de contraseñas fuerte

## 📞 Troubleshooting

### "Token inválido o expirado"
- Verificar que el token no ha expirado
- Regenerar token con login
- Revisar configuración de `JWT_SECRET`

### "Usuario no válido"
- Verificar que el usuario existe
- Revisar que el usuario está activo
- Revisar contraseña

### "CORS error"
- Kong Gateway debe tener CORS habilitado
- Verificar headers en respuesta

## 📄 Referencias

- [NestJS JWT](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [JWT.io](https://jwt.io/)
