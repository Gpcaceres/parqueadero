@echo off
echo.
echo ============================================
echo Reiniciando Docker Desktop
echo ============================================
echo.

echo [1/4] Deteniendo Docker Desktop...
taskkill /IM "Docker Desktop.exe" /F >nul 2>&1

echo [2/4] Esperando 15 segundos...
timeout /t 15 /nobreak

echo.
echo [3/4] Abriendo Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo [4/4] Esperando a que Docker esté listo (2 minutos)...
timeout /t 120 /nobreak

echo.
echo ============================================
echo Verificando que Docker está listo...
echo ============================================
echo.

docker ps >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker está listo y funcional
    echo.
    echo Ahora ejecuta:
    echo   docker-compose down
    echo   docker system prune -a -f --volumes
    echo   docker-compose up --build -d
) else (
    echo ❌ Docker aún no está listo
    echo Espera un poco más e intenta nuevamente
)

echo.
pause
