#!/bin/bash

# Script para verificar el estado de Kong y sus servicios

set -e

KONG_ADMIN_URL="http://localhost:8001"
KONG_PROXY_URL="http://localhost:8000"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Kong Health Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Función para check
check_service() {
    local name=$1
    local url=$2

    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $name${NC}"
        return 0
    else
        echo -e "${RED}✗ $name${NC}"
        return 1
    fi
}

# Verificaciones básicas
echo -e "${YELLOW}=== Servicios Kong ===${NC}\n"
check_service "Kong Admin API" "$KONG_ADMIN_URL/status"
check_service "Kong Proxy" "$KONG_PROXY_URL"

echo ""
echo -e "${YELLOW}=== Estado de Kong ===${NC}\n"

# Estado detallado
STATUS=$(curl -s "$KONG_ADMIN_URL/status" | jq . 2>/dev/null || echo "{}")

echo "Status: $(echo "$STATUS" | jq '.status // "unavailable"')"
echo "Uptime: $(echo "$STATUS" | jq '.db.reachable // false') segundos"
echo "Database: $(echo "$STATUS" | jq '.db.reachable // false')"

echo ""
echo -e "${YELLOW}=== Servicios Registrados ===${NC}\n"

SERVICES=$(curl -s "$KONG_ADMIN_URL/services" | jq '.data[]? | {name, url}' 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
    echo -e "${YELLOW}(No hay servicios registrados)${NC}"
else
    echo "$SERVICES" | jq -s '.'
fi

echo ""
echo -e "${YELLOW}=== Rutas Registradas ===${NC}\n"

ROUTES=$(curl -s "$KONG_ADMIN_URL/routes" | jq '.data[]? | {name, paths}' 2>/dev/null || echo "")

if [ -z "$ROUTES" ]; then
    echo -e "${YELLOW}(No hay rutas registradas)${NC}"
else
    echo "$ROUTES" | jq -s '.'
fi

echo ""
echo -e "${YELLOW}=== Consumidores ===${NC}\n"

CONSUMERS=$(curl -s "$KONG_ADMIN_URL/consumers" | jq '.data[]? | .username' 2>/dev/null || echo "")

if [ -z "$CONSUMERS" ]; then
    echo -e "${YELLOW}(No hay consumidores registrados)${NC}"
else
    echo "$CONSUMERS"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}URLs útiles:${NC}"
echo "Kong Admin: $KONG_ADMIN_URL"
echo "Kong Proxy: $KONG_PROXY_URL"
echo "Kong Manager: http://localhost:8002"
echo -e "${BLUE}========================================${NC}\n"

# Verificar Docker
echo -e "${YELLOW}=== Contenedores Docker ===${NC}\n"
docker-compose ps

echo ""
echo -e "${GREEN}Health Check completado${NC}\n"
