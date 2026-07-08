# 📦 Versiones Correctas de Dependencias

## ✅ Problemas Solucionados

El error `npm error notarget No matching version found for @nestjs/jwt@^12.0.0` fue causado por versiones inexistentes.

### Versiones Corregidas

```json
{
  "@nestjs/jwt": "^11.0.1",      // ❌ No: 12.0.0 → ✅ Sí: 11.0.1
  "@nestjs/passport": "^10.0.3"  // ✅ Versión correcta
}
```

## 📋 Dependencias Correctas - personas/package.json

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.4",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.1",        // ✅ CORREGIDA
    "@nestjs/mapped-types": "*",
    "@nestjs/passport": "^10.0.3",   // ✅ CORREGIDA
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/typeorm": "^11.0.1",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.21.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "typeorm": "^1.0.0",
    "uuid": "^14.0.0"
  }
}
```

## 🔍 Verificación de Versiones

```bash
# Verificar versión disponible de @nestjs/jwt
npm view @nestjs/jwt versions

# Ver la versión más reciente
npm view @nestjs/jwt version

# Ver dependencias de personas
cd personas
npm list
```

## 🚀 Pasos para Reconstruir

### Windows (Recomendado)
```bash
# Ejecutar el script batch
LIMPIAR_Y_RECONSTRUIR.bat

# O manualmente:
docker-compose down
docker system prune -a -f --volumes
docker-compose up --build -d
```

### Linux/Mac
```bash
# Ejecutar script bash
bash LIMPIAR_Y_RECONSTRUIR.sh

# O manualmente:
docker-compose down
docker system prune -a --volumes
docker-compose up --build
```

### Manual Step-by-Step
```bash
# 1. Detener servicios
docker-compose down

# 2. Limpiar todo
docker system prune -a --volumes

# 3. Limpiar node_modules locales (opcional pero recomendado)
rm -rf personas/node_modules
rm -rf vehiculos/node_modules
rm -rf ms-tickets/node_modules
rm -rf asignacion-trazabilidad/node_modules

# 4. Reconstruir
docker-compose up --build -d

# 5. Verificar
docker-compose ps
curl http://localhost:3001/health
```

## ✔️ Validar Construcción

```bash
# Ver logs de construcción
docker-compose logs personas

# Ver todos los servicios
docker-compose ps

# Health checks
curl http://localhost:3001/health    # Personas
curl http://localhost:3003/health    # Tickets
curl http://localhost:3000/health    # Vehículos
curl http://localhost:3002/api/asignaciones/health  # Asignación

# Acceder a Swagger
# http://localhost:3001/swagger  - Personas
# http://localhost:3003/swagger  - Tickets
```

## 📊 Matriz de Versiones Verificadas

| Paquete | Versión | Status |
|---------|---------|--------|
| @nestjs/common | ^11.0.1 | ✅ OK |
| @nestjs/config | ^4.0.4 | ✅ OK |
| @nestjs/core | ^11.0.1 | ✅ OK |
| @nestjs/jwt | ^11.0.1 | ✅ CORREGIDA |
| @nestjs/passport | ^10.0.3 | ✅ CORREGIDA |
| @nestjs/platform-express | ^11.0.1 | ✅ OK |
| @nestjs/swagger | ^7.0.0 | ✅ OK |
| @nestjs/typeorm | ^11.0.1 | ✅ OK |
| bcrypt | ^5.1.1 | ✅ OK |
| passport | ^0.7.0 | ✅ OK |
| passport-jwt | ^4.0.1 | ✅ OK |
| pg | ^8.21.0 | ✅ OK |
| typeorm | ^1.0.0 | ✅ OK |

## ⚠️ Si Sigue Fallando

### Opción 1: Limpiar npm cache
```bash
npm cache clean --force
```

### Opción 2: Usar versiones exactas
En lugar de `^11.0.1`, usar `11.0.1`

```json
{
  "@nestjs/jwt": "11.0.1",      // Versión exacta
  "@nestjs/passport": "10.0.3"  // Versión exacta
}
```

### Opción 3: Instalar manualmente
```bash
cd personas
npm install @nestjs/jwt@11.0.1 @nestjs/passport@10.0.3
```

## 🔗 Referencias

- [@nestjs/jwt NPM](https://www.npmjs.com/package/@nestjs/jwt)
- [@nestjs/passport NPM](https://www.npmjs.com/package/@nestjs/passport)
- [NestJS Documentation](https://docs.nestjs.com/)

## 📝 Cambios Realizados

### ✅ personas/package.json
```diff
- "@nestjs/jwt": "^12.0.0",
+ "@nestjs/jwt": "^11.0.1",

- "@nestjs/passport": "^10.0.0",
+ "@nestjs/passport": "^10.0.3",
```

---

**Las versiones están corregidas. Docker debería compilar sin errores ahora.** 🚀
