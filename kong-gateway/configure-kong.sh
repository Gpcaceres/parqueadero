#!/bin/bash

# Script para importar la configuración declarativa a Kong
# Este script carga los servicios y rutas definidas en kong.yml

set -e

KONG_ADMIN_URL="http://localhost:8001"
CONFIG_FILE="kong.yml"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Kong Configuration Loader${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verificar que Kong está disponible
echo -e "${YELLOW}Verificando conexión a Kong...${NC}"
if ! curl -s "$KONG_ADMIN_URL/status" > /dev/null; then
    echo -e "${RED}✗ No se puede conectar a Kong en $KONG_ADMIN_URL${NC}"
    echo -e "${YELLOW}Asegúrate de que Kong está corriendo: docker-compose up -d${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Kong está disponible${NC}\n"

# Función para crear un servicio
create_service() {
    local name=$1
    local url=$2

    echo -e "${BLUE}Creando servicio: $name${NC}"
    curl -s -X POST "$KONG_ADMIN_URL/services" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$name\", \"url\": \"$url\"}" > /dev/null
    echo -e "${GREEN}✓ Servicio creado${NC}"
}

# Función para crear una ruta
create_route() {
    local service=$1
    local name=$2
    local paths=$3

    echo -e "${BLUE}Creando ruta: $name (Servicio: $service)${NC}"
    curl -s -X POST "$KONG_ADMIN_URL/services/$service/routes" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$name\", \"paths\": [$paths], \"strip_path\": false}" > /dev/null
    echo -e "${GREEN}✓ Ruta creada${NC}"
}

# Función para agregar plugin
add_plugin() {
    local entity=$1
    local entity_id=$2
    local plugin_name=$3
    local plugin_config=$4

    echo -e "${BLUE}Agregando plugin: $plugin_name${NC}"
    curl -s -X POST "$KONG_ADMIN_URL/$entity/$entity_id/plugins" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$plugin_name\", \"config\": $plugin_config}" > /dev/null
    echo -e "${GREEN}✓ Plugin agregado${NC}"
}

# Función para crear consumidor
create_consumer() {
    local username=$1

    echo -e "${BLUE}Creando consumidor: $username${NC}"
    curl -s -X POST "$KONG_ADMIN_URL/consumers" \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$username\"}" > /dev/null
    echo -e "${GREEN}✓ Consumidor creado${NC}"
}

# Función para agregar credential
add_key_auth() {
    local consumer=$1
    local key=$2

    echo -e "${BLUE}Agregando API Key al consumidor: $consumer${NC}"
    curl -s -X POST "$KONG_ADMIN_URL/consumers/$consumer/key-auth" \
        -H "Content-Type: application/json" \
        -d "{\"key\": \"$key\"}" > /dev/null
    echo -e "${GREEN}✓ API Key agregada${NC}"
}

# ============================
# CONFIGURACIÓN MANUAL
# ============================

echo -e "${BLUE}=== Creando Servicios ===${NC}\n"

# Servicio Zonas
create_service "zonas-service" "http://host.docker.internal:8080"
echo ""

# Servicio Vehículos
create_service "vehiculos-service" "http://host.docker.internal:3000"
echo ""

# Servicio Personas
create_service "personas-service" "http://host.docker.internal:3001"
echo ""

echo -e "${BLUE}=== Creando Rutas ===${NC}\n"

# Rutas para Zonas
create_route "zonas-service" "zonas-api" "\"/api/zonas\", \"/api/espacios\""
create_route "zonas-service" "zonas-swagger" "\"/api/zonas/swagger-ui.html\", \"/api/zonas/v3/api-docs\""
echo ""

# Rutas para Vehículos
create_route "vehiculos-service" "vehiculos-api" "\"/api/vehiculos\", \"/api/marcas\", \"/api/modelos\""
create_route "vehiculos-service" "vehiculos-swagger" "\"/api/vehiculos/swagger-ui.html\", \"/api/vehiculos/docs\""
echo ""

# Rutas para Personas
create_route "personas-service" "personas-api" "\"/api/personas\", \"/api/usuarios\", \"/api/roles\""
create_route "personas-service" "personas-swagger" "\"/api/personas/swagger-ui.html\", \"/api/personas/docs\""
echo ""

echo -e "${BLUE}=== Agregando Plugins ===${NC}\n"

# CORS para Zonas
add_plugin "services" "zonas-service" "cors" '{
    "origins": ["*"],
    "credentials": true,
    "max_age": 3600,
    "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}'
echo ""

# Rate Limiting para Zonas
add_plugin "services" "zonas-service" "rate-limiting" '{"minute": 100, "policy": "local"}'
echo ""

# CORS para Vehículos
add_plugin "services" "vehiculos-service" "cors" '{"origins": ["*"], "credentials": true, "max_age": 3600}'
echo ""

# Rate Limiting para Vehículos
add_plugin "services" "vehiculos-service" "rate-limiting" '{"minute": 100, "policy": "local"}'
echo ""

# CORS para Personas
add_plugin "services" "personas-service" "cors" '{"origins": ["*"], "credentials": true, "max_age": 3600}'
echo ""

# Rate Limiting para Personas
add_plugin "services" "personas-service" "rate-limiting" '{"minute": 100, "policy": "local"}'
echo ""

echo -e "${BLUE}=== Creando Consumidores ===${NC}\n"

# Consumidor Admin
create_consumer "admin"
add_key_auth "admin" "admin-key-parqueadero-secret-12345"
echo ""

# Consumidor Mobile App
create_consumer "mobile-app"
add_key_auth "mobile-app" "mobile-app-key-secret-67890"
echo ""

# Consumidor System
create_consumer "system"
add_key_auth "system" "system-key-secret-11111"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Configuración de Kong completada${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}URLs útiles:${NC}"
echo "Kong Admin API: $KONG_ADMIN_URL"
echo "Kong Manager UI: http://localhost:8002"
echo "Kong Proxy: http://localhost:8000"
echo ""

echo -e "${YELLOW}Servicios registrados:${NC}"
curl -s "$KONG_ADMIN_URL/services" | jq '.data[] | {name, url}'
echo ""

echo -e "${YELLOW}Rutas registradas:${NC}"
curl -s "$KONG_ADMIN_URL/routes" | jq '.data[] | {name, paths}'
