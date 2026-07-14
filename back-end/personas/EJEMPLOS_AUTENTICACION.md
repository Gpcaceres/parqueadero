# 📝 Ejemplos de Uso - Autenticación JWT

## 🚀 Iniciando el Servicio

```bash
cd C:\Users\patri\OneDrive\Escritorio\Parqueadero\personas

# Instalar dependencias (si es primera vez)
npm install

# Modo desarrollo
npm run start:dev

# Modo producción
npm run start:prod
```

El servicio estará disponible en `http://localhost:3001`

## 1️⃣ Registro de Nuevo Usuario

### cURL
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "galopez11",
    "password": "MiPassword123!",
    "firstName": "Guillermo",
    "lastName": "López",
    "email": "guillermo.lopez@example.com",
    "phone": "3101234567"
  }'
```

### Respuesta
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NWVhNGFlMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJ1c2VybmFtZSI6ImdhbG9wZXoxMSIsImVtYWlsIjoiZ3VpbGxlcm1vLmxvcGV6QGV4YW1wbGUuY29tIiwicm9sZXMiOltdLCJpYXQiOjE2NDIzNDU2NzgsImV4cCI6MTY0MjQzMjA3OH0.abc123...",
  "user": {
    "id": "55ea4ae0-e29b-41d4-a716-446655440000",
    "username": "galopez11",
    "email": "guillermo.lopez@example.com",
    "firstName": "Guillermo",
    "lastName": "López",
    "roles": []
  }
}
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function registro() {
  try {
    const response = await axios.post('http://localhost:3001/auth/register', {
      username: 'galopez11',
      password: 'MiPassword123!',
      firstName: 'Guillermo',
      lastName: 'López',
      email: 'guillermo.lopez@example.com',
      phone: '3101234567'
    });

    const { access_token, user } = response.data;
    console.log('Token:', access_token);
    console.log('Usuario:', user);
    
    // Guardar token para futuras solicitudes
    localStorage.setItem('token', access_token);
  } catch (error) {
    console.error('Error en registro:', error.response.data);
  }
}

registro();
```

### TypeScript
```typescript
import axios from 'axios';

interface RegisterDto {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

async function registrarUsuario(datos: RegisterDto) {
  try {
    const response = await axios.post(
      'http://localhost:3001/auth/register',
      datos
    );

    return response.data;
  } catch (error) {
    throw new Error(`Error de registro: ${error.response.status}`);
  }
}
```

## 2️⃣ Login de Usuario

### cURL
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "galopez11",
    "password": "MiPassword123!"
  }'
```

### Respuesta
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "55ea4ae0-e29b-41d4-a716-446655440000",
    "username": "galopez11",
    "email": "guillermo.lopez@example.com",
    "firstName": "Guillermo",
    "lastName": "López",
    "roles": []
  }
}
```

### React Hook
```typescript
import { useState } from 'react';
import axios from 'axios';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3001/auth/login', {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      // Guardar token en localStorage
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error de login';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { token, user, loading, error, login };
}
```

## 3️⃣ Acceder a Rutas Protegidas

### cURL - Obtener Perfil
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### cURL - Verificar Token
```bash
curl -X GET http://localhost:3001/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript con Token
```javascript
const token = localStorage.getItem('token');

async function obtenerPerfil() {
  const response = await axios.get(
    'http://localhost:3001/auth/me',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  console.log('Perfil del usuario:', response.data);
}

obtenerPerfil();
```

### Axios Interceptor (Automático)
```typescript
import axios from 'axios';

// Crear instancia con interceptor
const apiClient = axios.create({
  baseURL: 'http://localhost:3001'
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usar en cualquier solicitud
apiClient.get('/auth/me').then(res => {
  console.log('Usuario:', res.data);
});
```

## 4️⃣ Refrescar Token

### cURL
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Authorization: Bearer $TOKEN"
```

### Respuesta
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### JavaScript
```javascript
async function refrescarToken() {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await axios.post(
      'http://localhost:3001/auth/refresh',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const nuevoToken = response.data.access_token;
    localStorage.setItem('authToken', nuevoToken);
    
    console.log('Token renovado');
  } catch (error) {
    console.error('Error al renovar token:', error);
    // Redirigir a login
  }
}
```

## 5️⃣ Logout

```typescript
function logout() {
  // Limpiar token y datos del usuario
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Redirigir a login
  window.location.href = '/login';
}
```

## 🧪 Test Completo en Postman

### 1. Crear Colección
- Nombre: "Personas API Auth"
- Environment: "Personas Dev"

### 2. Variables de Entorno
```
{
  "base_url": "http://localhost:3001",
  "token": ""
}
```

### 3. Request: Register
- **Método:** POST
- **URL:** `{{base_url}}/auth/register`
- **Body (JSON):**
```json
{
  "username": "galopez11",
  "password": "Password123!",
  "firstName": "Guillermo",
  "lastName": "López",
  "email": "guillermo@example.com",
  "phone": "3101234567"
}
```
- **Tests:**
```javascript
pm.environment.set("token", pm.response.json().access_token);
pm.test("Registro exitoso", () => {
  pm.response.to.have.status(201);
  pm.expect(pm.response.json()).to.have.property('access_token');
});
```

### 4. Request: Login
- **Método:** POST
- **URL:** `{{base_url}}/auth/login`
- **Body (JSON):**
```json
{
  "username": "galopez11",
  "password": "Password123!"
}
```
- **Tests:**
```javascript
pm.environment.set("token", pm.response.json().access_token);
```

### 5. Request: Get Profile
- **Método:** GET
- **URL:** `{{base_url}}/auth/me`
- **Headers:**
  - `Authorization: Bearer {{token}}`

## 🔑 Decodificar JWT

### En línea
Ir a [https://jwt.io/](https://jwt.io/) y pegar el token

### Node.js
```javascript
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIs...';
const decoded = jwt.decode(token);

console.log('Payload:', decoded);
// Output:
// {
//   sub: '55ea4ae0-e29b-41d4-a716-446655440000',
//   username: 'galopez11',
//   email: 'guillermo@example.com',
//   roles: [],
//   iat: 1642345678,
//   exp: 1642432078
// }
```

### JavaScript
```javascript
function decodificarJWT(token) {
  // Dividir en 3 partes
  const [header, payload, signature] = token.split('.');
  
  // Decodificar payload (base64url)
  const decodedPayload = atob(payload);
  
  return JSON.parse(decodedPayload);
}

const datos = decodificarJWT(token);
console.log(datos);
```

## ⚠️ Errores Comunes

### 401 - Unauthorized
```
Error: "Usuario no válido o inactivo"
```
**Solución:** Verificar que usuario existe y está activo

### 401 - Contraseña incorrecta
```
Error: "Contraseña incorrecta"
```
**Solución:** Revisar contraseña

### 409 - Usuario ya existe
```
Error: "El usuario ya existe"
```
**Solución:** Usar otro username

### 401 - Token inválido
```
Error: "Token inválido o expirado"
```
**Solución:** 
- Refrescar token con `/auth/refresh`
- Hacer login nuevamente

### 400 - Validación falla
```
Error: "ValidationError: password must be longer..."
```
**Solución:** Verificar formato de datos según DTOs

## 🔐 Consideraciones de Seguridad

### ✅ Hacer
- Guardar token en memory o secure storage
- Usar HTTPS en producción
- Renovar tokens periódicamente
- Implementar logout
- Validar en backend

### ❌ NO Hacer
- Guardar token en localStorage (vulnerable a XSS)
- Enviar token en URL
- Hardcodear credenciales
- Ignorar expiración de token
- Usar secret débil en JWT

## 📊 Estructura de Datos Completa

### Usuario Registrado
```json
{
  "id": "uuid-único",
  "username": "galopez11",
  "email": "guillermo@example.com",
  "firstName": "Guillermo",
  "lastName": "López",
  "phone": "3101234567",
  "active": true,
  "lastLogin": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T08:00:00Z",
  "roles": ["usuario"]
}
```

### Token JWT
```json
{
  "sub": "uuid-del-usuario",
  "username": "galopez11",
  "email": "guillermo@example.com",
  "roles": ["usuario"],
  "iat": 1642345678,
  "exp": 1642432078
}
```

## 🚀 Producción

### 1. Cambiar Secret JWT
```bash
# Generar secret aleatorio fuerte
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Guardar en .env
JWT_SECRET=abc123def456...
```

### 2. Habilitar HTTPS
```nginx
server {
  listen 443 ssl;
  ssl_certificate /path/to/cert;
  ssl_certificate_key /path/to/key;
  
  location / {
    proxy_pass http://localhost:3001;
  }
}
```

### 3. Rate Limiting
```bash
npm install express-rate-limit
```

### 4. CORS Seguro
```typescript
app.enableCors({
  origin: ['https://tudominio.com'],
  credentials: true
});
```

---

**¡Listo para autenticar usuarios! 🎉**
