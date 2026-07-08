@echo off
REM Script para limpiar Docker y reconstruir

echo.
echo ============================================
echo Limpiando Docker y reconstruyendo
echo ============================================
echo.

REM Detener servicios
echo [1/5] Deteniendo servicios...
docker-compose down

REM Limpiar cache y volúmenes
echo.
echo [2/5] Limpiando Docker...
docker system prune -a -f --volumes

REM Limpiar node_modules locales (opcional)
echo.
echo [3/5] Limpiando node_modules locales...
if exist personas\node_modules rmdir /s /q personas\node_modules
if exist vehiculos\node_modules rmdir /s /q vehiculos\node_modules
if exist ms-tickets\node_modules rmdir /s /q ms-tickets\node_modules
if exist asignacion-trazabilidad\node_modules rmdir /s /q asignacion-trazabilidad\node_modules

REM Reconstruir
echo.
echo [4/5] Reconstruyendo imágenes...
docker-compose up --build -d

REM Esperar
echo.
echo [5/5] Esperando a que los servicios inicien...
timeout /t 15 /nobreak

REM Mostrar estado
echo.
echo ============================================
echo Estado de los servicios
echo ============================================
docker-compose ps

REM Health checks
echo.
echo ============================================
echo Verificando health checks
echo ============================================
echo.

echo Tickets (3003):
curl -s http://localhost:3003/health

echo.
echo Personas (3001):
curl -s http://localhost:3001/health

echo.
echo Vehiculos (3000):
curl -s http://localhost:3000/health

echo.
echo Asignacion (3002):
curl -s http://localhost:3002/api/asignaciones/health

echo.
echo ============================================
echo URLs disponibles
echo ============================================
echo Kong Gateway:     http://localhost:8000
echo Personas API:     http://localhost:3001/swagger
echo Vehiculos API:    http://localhost:3000/swagger
echo Tickets API:      http://localhost:3003/swagger
echo Asignacion API:   http://localhost:3002/swagger
echo.
echo ============================================
echo Reconstruccion completada!
echo ============================================
pause
