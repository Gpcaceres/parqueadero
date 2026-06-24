# 🚀 Guía de Subida a GitHub - Parqueadero

Instrucciones para subir correctamente el proyecto Parqueadero a GitHub.

---

## 📋 Checklist Previo a GitHub

### ✅ Archivos Sensibles
- [ ] No hay archivos `.env` (solo `.env.example`)
- [ ] No hay archivos `.pem`, `.key`, `.crt`
- [ ] No hay archivos de credenciales
- [ ] No hay `credentials.json`

### ✅ Directorios
- [ ] Todos los `node_modules/` están gitignored
- [ ] No hay `dist/` o `build/` sin gitignore
- [ ] Los directorios de DB están gitignored

### ✅ Archivos Necesarios Incluidos
- [ ] `.env.example` en cada servicio
- [ ] `README.md` en cada directorio
- [ ] `package.json` en servicios Node
- [ ] `docker-compose.yml` en cada servicio
- [ ] `pom.xml` en servicios Spring Boot

---

## 🔧 Pasos para Subir a GitHub

### Paso 1: Inicializar Repositorio Git

```bash
cd C:\Users\patri\OneDrive\Escritorio\Parqueadero

# Inicializar git
git init

# Agregar configuración global (si es la primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"

# O configuración local del proyecto
git config user.name "Tu Nombre"
git config user.email "tu.email@ejemplo.com"
```

### Paso 2: Verificar .gitignore

```bash
# Listar archivos que se agregarían (sin .gitignore)
git status

# Debe mostrar SOLO los archivos que quieres incluir:
# - Código fuente
# - README.md
# - .gitignore
# - .env.example
# - docker-compose.yml
# - package.json
# - Etc.
```

### Paso 3: Agregar Todos los Archivos

```bash
# Agregar todos los archivos (respetando .gitignore)
git add .

# Verificar qué se agregó
git status

# Solo deben aparecer archivos "staged for commit"
# Y NO deben incluir node_modules, dist, .env, etc.
```

### Paso 4: Commit Inicial

```bash
git commit -m "Initial commit: Parqueadero - Complete microservices architecture

- Kong API Gateway (independent)
- Assignment and Traceability microservice (NestJS)
- Integration with Vehicles, Users, and Zones services
- Comprehensive testing and documentation"
```

### Paso 5: Crear Repositorio en GitHub

1. Ir a https://github.com/new
2. Nombre: `parqueadero` (o similar)
3. Descripción: "Intelligent parking lot management system with microservices architecture"
4. Seleccionar: Public o Private
5. **NO** inicializar con README, .gitignore, o license (ya los tenemos)
6. Crear repositorio

### Paso 6: Agregar Remote y Hacer Push

```bash
# Agregar remote (reemplazar USERNAME y REPO)
git remote add origin https://github.com/USERNAME/parqueadero.git

# Renombrar rama a main (si aún es master)
git branch -M main

# Hacer push inicial
git push -u origin main
```

### Paso 7: Verificar en GitHub

1. Ir a https://github.com/USERNAME/parqueadero
2. Verificar que todos los archivos están presentes
3. Verificar que `node_modules/`, `dist/`, `.env` NO están
4. Verificar que `.env.example` SÍ está

---

## 📁 Estructura Esperada en GitHub

```
parqueadero/
├── .gitignore                          ✅ Raíz
├── GITHUB_SETUP.md                     ✅ Este archivo
├── EVALUACION_CUMPLIMIENTO.md          ✅ Evaluación
├── docker-compose.yml                  ✅ Orquestación raíz
│
├── kong-gateway/
│   ├── .gitignore                      ✅
│   ├── docker-compose.yml              ✅
│   ├── README.md                       ✅
│   ├── register-service.sh             ✅
│   ├── .env.example                    ✅
│   └── kong.yml                        ✅
│
├── asignacion-trazabilidad/
│   ├── .gitignore                      ✅
│   ├── package.json                    ✅
│   ├── tsconfig.json                   ✅
│   ├── docker-compose.yml              ✅
│   ├── Dockerfile                      ✅
│   ├── .env.example                    ✅
│   ├── README.md                       ✅
│   ├── REQUISITOS.md                   ✅
│   ├── INTEGRACIONES.md                ✅
│   ├── src/
│   │   ├── entities/                   ✅
│   │   ├── services/                   ✅
│   │   ├── repositories/               ✅
│   │   ├── controllers/                ✅
│   │   ├── dtos/                       ✅
│   │   ├── app.module.ts               ✅
│   │   └── main.ts                     ✅
│   └── node_modules/                   ❌ IGNORADO
│
├── zonas/
│   ├── .gitignore                      ✅
│   ├── pom.xml                         ✅
│   ├── docker-compose.yml              ✅
│   ├── .env.example                    ✅
│   ├── src/                            ✅
│   └── target/                         ❌ IGNORADO
│
├── vehiculos/
│   ├── .gitignore                      ✅
│   ├── package.json                    ✅
│   ├── docker-compose.yml              ✅
│   ├── .env.example                    ✅
│   ├── src/                            ✅
│   └── node_modules/                   ❌ IGNORADO
│
└── personas/
    ├── .gitignore                      ✅
    ├── package.json                    ✅
    ├── docker-compose.yml              ✅
    ├── .env.example                    ✅
    ├── src/                            ✅
    └── node_modules/                   ❌ IGNORADO
```

---

## 🔄 Después de Subir a GitHub

### Clonar el Proyecto

```bash
# Clonar
git clone https://github.com/USERNAME/parqueadero.git
cd parqueadero

# Instalar dependencias
cd asignacion-trazabilidad
npm install

cd ../vehiculos
npm install

cd ../zonas
mvn clean install

# Levantar servicios
cd ..
docker-compose up -d
```

### Hacer Cambios Locales

```bash
# Crear rama de features
git checkout -b feature/nombre-del-feature

# Hacer cambios
# ...

# Commit
git add .
git commit -m "Descripción del cambio"

# Push
git push origin feature/nombre-del-feature

# En GitHub: Crear Pull Request
```

---

## 🛡️ Seguridad

### Archivos que NUNCA deben subirse

```
❌ .env (variables sensibles)
❌ *.pem, *.key, *.crt (certificados)
❌ credentials.json (autenticación)
❌ node_modules/ (se regeneran con npm install)
❌ dist/, build/, target/ (generados en build)
❌ .DS_Store (archivos del SO)
❌ .vscode/ (configuración personal)
❌ .idea/ (configuración personal)
```

### Archivos que SÍ deben subirse

```
✅ .env.example (plantilla)
✅ .gitignore (reglas)
✅ README.md (documentación)
✅ docker-compose.yml (orquestación)
✅ package.json (dependencias)
✅ tsconfig.json (configuración TS)
✅ Dockerfile (imagen)
✅ src/ (código fuente)
```

---

## 🔐 Si Accidentalmente Subiste Archivo Sensible

```bash
# Opción 1: Eliminar archivo del historio (complejo)
git filter-branch --tree-filter 'rm -f /ruta/al/archivo' HEAD

# Opción 2: Hacer push de .gitignore actualizado (simple)
# 1. Agregar archivo a .gitignore
# 2. git add .gitignore
# 3. git commit -m "Add sensitive files to gitignore"
# 4. git push

# IMPORTANTE: Los cambios anteriores aún estarán en el historio
# Para usar OpcionTodoDebería regenerar las claves/contraseñas
```

---

## 📋 Verificación Final

Antes de hacer push:

```bash
# Verificar que no hay archivos sensibles
git status --short

# Debe mostrar solo archivos permitidos:
# .env.example ✅
# README.md ✅
# src/ ✅
# NO debe mostrar:
# node_modules/ ❌
# .env ❌
# dist/ ❌
# .DS_Store ❌
```

---

## 🆘 Troubleshooting

### Problema: "*.log" aparece en git status

```bash
# Solución: Agregar a .gitignore y remover del index
echo "*.log" >> .gitignore
git rm -r --cached .
git add .gitignore
git commit -m "Remove log files from git"
```

### Problema: "node_modules" aparece en git status

```bash
# Solución: Ya debe estar en .gitignore
git rm -r --cached node_modules/
git commit -m "Remove node_modules from git"
```

### Problema: "push rejected"

```bash
# Puede ser que la rama remota tenga cambios
git pull origin main
git push origin main
```

---

## 📚 Recursos

- [GitHub Docs - Adding locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [Git - Ignoring files](https://git-scm.com/docs/gitignore)
- [GitHub - Generating SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

---

**Última actualización:** 2024-06-24
