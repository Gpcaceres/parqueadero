@echo off
setlocal enabledelayedexpansion

echo.
echo ========== PARQUEADERO - COMPILACION ==========
echo.
echo [1] Deteniendo servicios...
docker-compose down

echo.
echo [2] Limpiando Docker...
docker system prune -a -f --volumes

echo.
echo [3] Reconstruyendo...
docker-compose up --build -d

echo.
echo [4] Esperando servicios...
timeout /t 20 /nobreak

echo.
echo ========== ESTADO ==========
docker-compose ps

echo.
echo ========== URLS ==========
echo Kong Gateway:  http://localhost:8000
echo Personas:      http://localhost:3001/swagger
echo Tickets:       http://localhost:3003/swagger
echo Vehiculos:     http://localhost:3000/swagger
echo.

pause
