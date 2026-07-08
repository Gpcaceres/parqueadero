# 👥 Roles y Permisos - Microservicio Personas

## Resumen

El sistema tiene 4 roles principales con permisos específicos para controlar acceso a funcionalidades.

## 🎭 Roles Disponibles

### 1. **Cliente**
Usuario regular del sistema de parqueadero.

**Permisos:**
- ✅ `auth.login` - Iniciar sesión
- ✅ `auth.register` - Registrarse
- ✅ `zones.read` - Ver zonas de estacionamiento
- ✅ `spaces.read` - Ver espacios disponibles
- ✅ `vehicles.read` - Ver sus vehículos
- ✅ `vehicles.create` - Registrar nuevo vehículo
- ✅ `vehicles.update` - Actualizar vehículo
- ✅ `vehicles.delete` - Eliminar vehículo
- ✅ `profile.read` - Ver su perfil
- ✅ `profile.update` - Actualizar su perfil
- ✅ `tickets.read` - Ver sus tickets
- ✅ `tickets.create` - Crear ticket (entrada)

### 2. **Admin**
Administrador del sistema con acceso a gestión de recursos.

**Permisos:**
- ✅ Todos los permisos de Cliente
- ✅ `zones.create`, `zones.update`, `zones.delete` - Gestionar zonas
- ✅ `spaces.create`, `spaces.update`, `spaces.delete` - Gestionar espacios
- ✅ `vehicles.create`, `vehicles.update`, `vehicles.delete` - Gestionar vehículos
- ✅ `roles.read`, `roles.create`, `roles.update`, `roles.delete` - Gestionar roles
- ✅ `users.read`, `users.create`, `users.update`, `users.delete`, `users.assignRoles` - Gestionar usuarios
- ✅ `assignments.read`, `assignments.create`, `assignments.update`, `assignments.delete` - Gestionar asignaciones
- ✅ `tickets.read`, `tickets.create`, `tickets.update` - Gestionar tickets

### 3. **Recaudador**
Usuario encargado de cobros y pagos.

**Permisos:**
- ✅ `auth.login` - Iniciar sesión
- ✅ `spaces.read`, `spaces.update` - Ver y actualizar espacios
- ✅ `vehicles.read` - Ver vehículos
- ✅ `tickets.read`, `tickets.create`, `tickets.update` - Gestionar tickets
- ✅ `profile.read`, `profile.update` - Ver y actualizar perfil

### 4. **Root**
Super administrador con todos los permisos (sin restricciones).

**Permisos:**
- ✅ `*` - Super poderes (acceso total)

## 📋 Matriz de Permisos

| Permiso | Cliente | Admin | Recaudador | Root |
|---------|---------|-------|-----------|------|
| auth.login | ✅ | ✅ | ✅ | ✅ |
| auth.register | ✅ | ✅ | ❌ | ✅ |
| zones.read | ✅ | ✅ | ❌ | ✅ |
| zones.* | ❌ | ✅ | ❌ | ✅ |
| spaces.read | ✅ | ✅ | ✅ | ✅ |
| spaces.* | ❌ | ✅ | ✅ | ✅ |
| vehicles.read | ✅ | ✅ | ✅ | ✅ |
| vehicles.* | ✅ | ✅ | ❌ | ✅ |
| roles.* | ❌ | ✅ | ❌ | ✅ |
| users.* | ❌ | ✅ | ❌ | ✅ |
| assignments.* | ❌ | ✅ | ❌ | ✅ |
| tickets.* | ✅ | ✅ | ✅ | ✅ |
| profile.* | ✅ | ✅ | ✅ | ✅ |

## 🔐 Protección de Rutas

### Guard de Roles

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'root')
  async adminOnly() {
    // Solo admin y root pueden acceder
    return { message: 'Área administrativa' };
  }
}
```

## 📡 API Endpoints

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "galopez11",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "galopez11",
    "roles": ["cliente"]
  }
}
```

### Ver Roles
```bash
GET /roles
Authorization: Bearer <token>
```

**Requiere:** Admin o Root

### Ver Permisos
```bash
GET /roles/permissions
Authorization: Bearer <token>
```

**Disponible para:** Todos los usuarios autenticados

### Ver Permisos de un Rol
```bash
GET /roles/{roleId}/permissions
Authorization: Bearer <token>
```

**Requiere:** Admin o Root

### Asignar Permisos a Rol
```bash
POST /roles/{roleId}/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionIds": ["perm-id-1", "perm-id-2"]
}
```

**Requiere:** Root

## 🗄️ Tablas de Base de Datos

### roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### permissions
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### role_permissions (Muchos a Muchos)
```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

### user_roles
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  id_user UUID REFERENCES users(id_person),
  id_role UUID REFERENCES roles(id),
  f_creacion TIMESTAMP DEFAULT NOW(),
  f_actual TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Inicialización de Roles

Al iniciar el microservicio, se crean automáticamente:

1. ✅ 4 Roles (cliente, admin, recaudador, root)
2. ✅ 20+ Permisos
3. ✅ Asignación de permisos a roles

**Log esperado al iniciar:**
```
🌱 Iniciando seed de roles y permisos...
📌 Creando permisos...
✅ Permisos creados/verificados
👥 Creando roles...
✓ Rol creado: cliente
✅ Rol cliente con 12 permisos
✓ Rol creado: admin
✅ Rol admin con 28 permisos
✓ Rol creado: recaudador
✅ Rol recaudador con 8 permisos
✓ Rol creado: root
✅ Rol root con 27 permisos (super poderes)
✅ Seed completado exitosamente
```

## 📝 Asignar Rol a Usuario

Para asignar un rol a un usuario después del registro:

```bash
# 1. Obtener ID del usuario y rol
GET /users

# 2. Asignar rol (requiere admin)
POST /users/{userId}/roles/{roleId}
Authorization: Bearer <admin-token>
```

## ⚠️ Consideraciones de Seguridad

✅ **Implementado:**
- Guards en rutas protegidas
- Validación de roles en cada request
- Super rol (root) para emergencias
- Permisos granulares

⚠️ **Considerar para Producción:**
- Auditoría de cambios de roles
- Histórico de permisos
- Renovación periódica de accesos
- Alertas de acceso no autorizado
- Rate limiting en endpoints críticos

## 🔧 Cambiar Roles de Usuario

### Por Admin
```typescript
// Solo un admin puede cambiar roles
const usuario = await userService.addRoleToUser(userId, roleId);
```

### Por Root
```typescript
// Root puede hacer cualquier cambio sin restricciones
const usuario = await userService.addRoleToUser(userId, roleId);
```

## 📊 Ejemplo de Flujo

```
1. Usuario se registra
   └─ Rol: cliente (automático)

2. Solicitud a Admin
   └─ Admin asigna rol: "recaudador"
   └─ Usuario ahora tiene ambos roles

3. Usuario intenta acceder a /admin
   └─ Guard valida
   └─ Error: "Se requiere rol admin"

4. Admin accede a /admin
   └─ Guard valida ✅
   └─ Acceso permitido
```

## 🎯 Próximos Pasos

1. Asignar roles a usuarios tras registro
2. Implementar auditoría de cambios
3. Agregar endpoints para gestionar user-roles
4. Implementar caducidad de roles
5. Agregar 2FA para cambios de rol críticos

---

**Sistema de roles completo y funcional** ✅
