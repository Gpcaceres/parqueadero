# 👤 Flujo Completo de Registro de Usuario

## 🔄 Qué Ocurre al Registrarse

Cuando un usuario se registra en el sistema, se ejecuta automáticamente el siguiente flujo:

### Paso 1️⃣: Crear Persona
```
Input: firstName, lastName, phone
↓
Acción: Crear registro en tabla "personas"
↓
Output: persona.id (UUID)
```

### Paso 2️⃣: Crear Usuario
```
Input: username (generado automáticamente), password, persona.id
↓
Acciones:
  - Hash de contraseña con bcrypt
  - Crear registro en tabla "users"
  - Asociar con Persona
↓
Output: user.id_person, user.username
```

### Paso 3️⃣: Asignar Rol (NUEVO ✅)
```
Input: usuario creado
↓
Acciones:
  - Buscar rol "cliente" en tabla "roles"
  - Crear registro en tabla "user_roles"
  - Asociar usuario con rol
↓
Output: Usuario tiene rol "cliente"
```

### Paso 4️⃣: Generar JWT Token
```
Input: usuario con rol
↓
Acciones:
  - Crear payload con datos del usuario
  - Incluir roles: ["cliente"]
  - Firmar token con JWT
↓
Output: access_token válido por 24 horas
```

## 📊 Estructura de Datos Creada

### Tabla personas
```sql
INSERT INTO personas (id, first_name, last_name, email, phone, created_at)
VALUES (uuid, 'Guillermo', 'López', 'glopez@test.com', '3101234567', NOW());
```

### Tabla users
```sql
INSERT INTO users (id_person, username, password_hash, active, created_at)
VALUES (uuid, 'glopez', '$2b$10$...hash...', true, NOW());
```

### Tabla user_roles
```sql
INSERT INTO user_roles (id, id_person, id_role, f_creacion)
VALUES (uuid, user_id, role_id, NOW());
```

## 🎯 Resultado Final

Cuando el usuario se registra, recibe:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "glopez",
    "email": "glopez@test.com",
    "firstName": "Guillermo",
    "lastName": "López",
    "roles": ["cliente"]  ✅ Rol asignado automáticamente
  }
}
```

## 📝 Registro Completo (HTTP)

```http
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "firstName": "Guillermo",
  "lastName": "López",
  "password": "Password123!",
  "phone": "3101234567"
}
```

### Respuesta (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJ1c2VybmFtZSI6Imdsb3BleiIsImVtYWlsIjoiZ2xvcGV6QHRlc3QuY29tIiwicm9sZXMiOlsiY2xpZW50ZSJdLCJpYXQiOjE2NDIzNDU2NzgsImV4cCI6MTY0MjQzMjA3OH0.abc123...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "glopez",
    "email": "glopez@test.com",
    "firstName": "Guillermo",
    "lastName": "López",
    "roles": ["cliente"]
  }
}
```

## 🔑 JWT Payload Decodificado

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440001",
  "username": "glopez",
  "email": "glopez@test.com",
  "roles": ["cliente"],
  "iat": 1642345678,
  "exp": 1642432078
}
```

## ✅ Permisos del Cliente

Con el rol "cliente", el usuario puede:

```
✅ auth.login
✅ auth.register
✅ zones.read
✅ spaces.read
✅ vehicles.read
✅ vehicles.create
✅ vehicles.update
✅ vehicles.delete
✅ profile.read
✅ profile.update
✅ tickets.read
✅ tickets.create
```

## 🚀 Cambiar Rol de Usuario

Solo ADMIN o ROOT pueden cambiar roles:

```http
POST http://localhost:3001/roles/{roleId}/permissions
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "permissionIds": ["perm-id-1", "perm-id-2"]
}
```

## 📋 Flujo Gráfico

```
┌─────────────────────────────────┐
│     Usuario Se Registra         │
│ firstName, lastName, password    │
└──────────────┬──────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Crear Persona│
        └──────┬───────┘
               │ persona.id
               ▼
        ┌──────────────────┐
        │  Crear Usuario   │
        │ Hash Contraseña  │
        └──────┬───────────┘
               │ user.id_person
               ▼
      ┌────────────────────┐
      │  Buscar rol CLI    │
      │ Asignar a Usuario  │
      └────────┬───────────┘
               │ roles: ["cliente"]
               ▼
      ┌──────────────────┐
      │  Generar JWT     │
      │ Incluir Roles    │
      └────────┬─────────┘
               │ access_token
               ▼
      ┌──────────────────┐
      │  Devolver Token  │
      │   + User Data    │
      └──────────────────┘
```

## 🔐 Seguridad

✅ Contraseña hasheada con bcrypt (10 rounds)
✅ Username generado automáticamente y único
✅ Token JWT firmado y expirado en 24h
✅ Rol asignado automáticamente (cliente)
✅ Email generado automáticamente (será mejorado)

## 📌 Notas Importantes

- El username se **genera automáticamente** basado en firstName + lastName
- El email se genera como `{username}@test.com` (puede mejorarse)
- El rol **cliente** se asigna automáticamente
- La contraseña se hashea con bcrypt (10 rounds = ~100ms de hash)
- El token JWT expira en **24 horas**

---

**✅ Sistema completamente automático y seguro**
