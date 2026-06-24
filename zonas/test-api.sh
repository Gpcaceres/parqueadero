#!/bin/bash

# Script para probar la API a través de Kong Gateway

set -e

# Variables
KONG_PROXY_URL="http://localhost:8000"
KONG_ADMIN_API="http://localhost:8001"
APP_URL="http://localhost:8080"
API_KEY="zonas-admin-key-12345"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test Suite para API Parqueadero ===${NC}\n"

# Función para esperar a que un servicio esté disponible
wait_for_service() {
  local url=$1
  local service_name=$2
  local max_attempts=30
  local attempt=1

  echo -e "${BLUE}Esperando por $service_name...${NC}"

  while [ $attempt -le $max_attempts ]; do
    if curl -s "$url" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ $service_name está disponible${NC}\n"
      return 0
    fi
    echo -n "."
    sleep 2
    ((attempt++))
  done

  echo -e "${RED}✗ $service_name no está disponible${NC}\n"
  return 1
}

# 1. Verificar servicios
echo -e "${BLUE}--- Verificando Servicios ---${NC}\n"

wait_for_service "$APP_URL/actuator/health" "Aplicación Zonas"
wait_for_service "$KONG_ADMIN_API/status" "Kong Admin API"

# 2. Probar acceso directo a la aplicación
echo -e "${BLUE}--- Pruebas Directas (sin Kong) ---${NC}\n"

echo "GET /actuator/health"
curl -s "$APP_URL/actuator/health" | jq . || echo "No response"
echo -e "\n"

echo "GET /v3/api-docs (Swagger spec)"
curl -s "$APP_URL/v3/api-docs" | jq '.info' || echo "No response"
echo -e "\n"

# 3. Configurar Kong
echo -e "${BLUE}--- Configurando Kong ---${NC}\n"

# Crear servicio si no existe
echo "Creando/Actualizando servicio Zonas en Kong..."
curl -s -X PUT "$KONG_ADMIN_API/services/zonas-service" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "zonas-service",
    "url": "http://zonas:8080",
    "tags": ["parqueadero"]
  }' | jq '.id'

# Crear ruta si no existe
echo "Creando/Actualizando ruta API..."
curl -s -X PUT "$KONG_ADMIN_API/services/zonas-service/routes/zonas-api-route" \
  -H "Content-Type: application/json" \
  -d '{
    "paths": ["/api/zonas", "/api/espacios"],
    "strip_path": false,
    "tags": ["parqueadero"]
  }' | jq '.id'

echo -e "${GREEN}✓ Kong configurado${NC}\n"

# 4. Probar a través de Kong
echo -e "${BLUE}--- Pruebas vía Kong Gateway ---${NC}\n"

echo "GET /api/zonas"
curl -s -X GET "$KONG_PROXY_URL/api/zonas" \
  -H "apikey: $API_KEY" | jq . || echo "Endpoint no disponible"
echo -e "\n"

# 5. Estado de Kong
echo -e "${BLUE}--- Estado de Kong ---${NC}\n"

echo "Servicios registrados:"
curl -s "$KONG_ADMIN_API/services" | jq '.data[].name'
echo -e "\n"

echo "Rutas registradas:"
curl -s "$KONG_ADMIN_API/routes" | jq '.data[].paths'
echo -e "\n"

# 6. Información de Swagger
echo -e "${BLUE}--- Información de Swagger/OpenAPI ---${NC}\n"

echo "URL de Swagger UI: $APP_URL/swagger-ui.html"
echo "URL de API Docs (JSON): $APP_URL/v3/api-docs"
echo "URL de API Docs (YAML): $APP_URL/v3/api-docs.yaml"
echo -e "\n"

# 7. URLs útiles
echo -e "${BLUE}--- URLs Útiles ---${NC}\n"

echo "Kong Manager UI: http://localhost:8002"
echo "Kong Admin API: http://localhost:8001"
echo "Kong Proxy: http://localhost:8000"
echo "Swagger UI: http://localhost:8080/swagger-ui.html"
echo "Aplicación directa: http://localhost:8080"
echo -e "\n"

echo -e "${GREEN}=== Test completado ===${NC}\n"
