#!/bin/bash

# Script para registrar un nuevo servicio en Kong de manera dinámica
# Uso: ./register-service.sh <service-name> <service-url> [route-paths]
#
# Ejemplos:
# ./register-service.sh zonas http://localhost:8080 "/api/zonas" "/api/espacios"
# ./register-service.sh vehiculos http://localhost:3000 "/api/vehiculos"
# ./register-service.sh personas http://localhost:3001 "/api/personas" "/api/usuarios" "/api/roles"

set -e

KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Validar argumentos
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Faltan argumentos${NC}"
    echo ""
    echo "Uso: ./register-service.sh <service-name> <service-url> [route-paths...]"
    echo ""
    echo "Ejemplos:"
    echo "  ./register-service.sh zonas http://localhost:8080 /api/zonas /api/espacios"
    echo "  ./register-service.sh vehiculos http://localhost:3000 /api/vehiculos"
    echo "  ./register-service.sh personas http://localhost:3001 /api/personas /api/usuarios"
    echo ""
    exit 1
fi

SERVICE_NAME=$1
SERVICE_URL=$2
shift 2
ROUTES=("$@")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Registrar Servicio en Kong${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Parámetros:${NC}"
echo "Service Name: $SERVICE_NAME"
echo "Service URL: $SERVICE_URL"
echo "Routes: ${ROUTES[@]}"
echo ""

# Verificar que Kong está disponible
echo -e "${YELLOW}Verificando conexión a Kong...${NC}"
if ! curl -s "$KONG_ADMIN_URL/status" > /dev/null; then
    echo -e "${RED}✗ No se puede conectar a Kong en $KONG_ADMIN_URL${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Kong está disponible${NC}\n"

# Crear el servicio
echo -e "${BLUE}Creando servicio: $SERVICE_NAME${NC}"
SERVICE_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$SERVICE_NAME\",
        \"url\": \"$SERVICE_URL\",
        \"tags\": [\"parqueadero\", \"$SERVICE_NAME\"]
    }")

SERVICE_ID=$(echo "$SERVICE_RESPONSE" | jq -r '.id // empty')

if [ -z "$SERVICE_ID" ]; then
    echo -e "${RED}✗ Error al crear el servicio${NC}"
    echo "$SERVICE_RESPONSE" | jq .
    exit 1
fi

echo -e "${GREEN}✓ Servicio creado (ID: $SERVICE_ID)${NC}\n"

# Crear las rutas
if [ ${#ROUTES[@]} -gt 0 ]; then
    echo -e "${BLUE}Creando rutas...${NC}"

    # Convertir array de rutas a formato JSON
    PATHS_JSON="["
    for i in "${!ROUTES[@]}"; do
        ROUTE="${ROUTES[$i]}"
        if [ $i -gt 0 ]; then
            PATHS_JSON+=","
        fi
        PATHS_JSON+="\"$ROUTE\""
    done
    PATHS_JSON+="]"

    ROUTE_NAME="${SERVICE_NAME}-routes"
    ROUTE_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_ID/routes" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$ROUTE_NAME\",
            \"paths\": $PATHS_JSON,
            \"strip_path\": false,
            \"tags\": [\"parqueadero\", \"$SERVICE_NAME\"]
        }")

    ROUTE_ID=$(echo "$ROUTE_RESPONSE" | jq -r '.id // empty')

    if [ -z "$ROUTE_ID" ]; then
        echo -e "${RED}✗ Error al crear la ruta${NC}"
        echo "$ROUTE_RESPONSE" | jq .
        exit 1
    fi

    echo -e "${GREEN}✓ Rutas creadas (ID: $ROUTE_ID)${NC}"
    echo -e "  Paths: $PATHS_JSON\n"
fi

# Agregar plugins de CORS
echo -e "${BLUE}Agregando plugin CORS...${NC}"
CORS_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_ID/plugins" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "cors",
        "config": {
            "origins": ["*"],
            "credentials": true,
            "max_age": 3600,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
        }
    }')

echo -e "${GREEN}✓ Plugin CORS agregado${NC}\n"

# Agregar plugin de Rate Limiting
echo -e "${BLUE}Agregando plugin Rate Limiting...${NC}"
RATE_LIMIT_RESPONSE=$(curl -s -X POST "$KONG_ADMIN_URL/services/$SERVICE_ID/plugins" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "rate-limiting",
        "config": {
            "minute": 100,
            "policy": "local"
        }
    }')

echo -e "${GREEN}✓ Plugin Rate Limiting agregado${NC}\n"

# Resumen
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Servicio registrado exitosamente${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Información del Servicio:${NC}"
echo "Nombre: $SERVICE_NAME"
echo "ID: $SERVICE_ID"
echo "URL: $SERVICE_URL"
echo ""

echo -e "${YELLOW}Acceder al servicio:${NC}"
for route in "${ROUTES[@]}"; do
    echo "  http://localhost:8000$route"
done
echo ""

echo -e "${YELLOW}Verificar en Kong:${NC}"
echo "  Admin API: $KONG_ADMIN_URL/services/$SERVICE_ID"
echo "  Kong Manager: http://localhost:8002"
