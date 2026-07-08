@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ============================================
echo SOLUCION COMPLETA - Parqueadero
echo ============================================
echo.

echo [1/6] Deteniendo servicios...
docker-compose down

echo.
echo [2/6] Limpiando Docker...
docker system prune -a -f --volumes

echo.
echo [3/6] Limpiando node_modules locales...
rmdir /s /q personas\node_modules 2>nul
rmdir /s /q vehiculos\node_modules 2>nul
rmdir /s /q ms-tickets\node_modules 2>nul
rmdir /s /q asignacion-trazabilidad\node_modules 2>nul

echo.
echo [4/6] Configurando npm...
npm config set fetch-timeout 120000
npm config set fetch-retries 5
npm config set registry https://registry.npmjs.org/

echo.
echo [5/6] Reconstruyendo imagenes Docker...
echo (Este paso puede tardar 15-25 minutos)
docker-compose up --build -d

echo.
echo [6/6] Esperando a que los servicios inicien...
timeout /t 30 /nobreak

echo.
echo ============================================
echo VERIFICACION
echo ============================================
echo.

echo Estado de servicios:
docker-compose ps

echo.
echo Verificando health checks...
echo.

set count=0
:health_check_loop
set /a count+=1

echo Intento %count%/10...

curl -s http://localhost:3001/health >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo [OK] Personas
) else (
    echo [WAIT] Personas iniciando...
)

curl -s http://localhost:3003/health >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo [OK] Tickets
) else (
    echo [WAIT] Tickets iniciando...
)

curl -s http://localhost:3000/health >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo [OK] Vehiculos
) else (
    echo [WAIT] Vehiculos iniciando...
)

if !count! LSS 10 (
    timeout /t 5 /nobreak
    cls
    goto health_check_loop
)

echo.
echo ============================================
echo RESULTADO FINAL
echo ============================================
echo.

echo Servicios disponibles:
echo   Kong Gateway:      http://localhost:8000
echo   Personas API:      http://localhost:3001/swagger
echo   Tickets API:       http://localhost:3003/swagger
echo   Vehiculos API:     http://localhost:3000/swagger
echo   Asignacion API:    http://localhost:3002/swagger
echo.

echo Credenciales de prueba:
echo   Username: galopez11
echo   Password: Password123!
echo.

echo ============================================
echo Sistema listo!
echo ============================================
echo.

pause
