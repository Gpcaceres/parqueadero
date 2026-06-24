#!/bin/bash

# Setup Kong Gateway con todos los microservicios
# Este script registra los servicios y rutas en Kong

KONG_ADMIN="http://localhost:8001"

echo "🔧 Configurando Kong Gateway..."
echo "Admin API: $KONG_ADMIN"

# Esperar a que Kong esté listo
sleep 5

# ============================
# ASIGNACIÓN Y TRAZABILIDAD
# ============================
echo "📝 Registrando Asignación y Trazabilidad..."

curl -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "asignacion-service",
    "url": "http://asignacion-trazabilidad:3002",
    "tags": ["parqueadero"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/asignacion-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "asignacion-api",
    "paths": ["/api/asignaciones"],
    "strip_path": false,
    "tags": ["asignacion"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/asignacion-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "asignacion-swagger",
    "paths": ["/asignacion/swagger", "/asignacion/swagger-ui.html"],
    "strip_path": true,
    "tags": ["docs"]
  }' 2>/dev/null

# ============================
# VEHÍCULOS
# ============================
echo "🚗 Registrando Vehículos..."

curl -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vehiculos-service",
    "url": "http://vehiculos:3000",
    "tags": ["parqueadero"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/vehiculos-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vehiculos-api",
    "paths": ["/vehiculos"],
    "strip_path": true,
    "tags": ["vehiculos"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/vehiculos-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vehiculos-swagger",
    "paths": ["/vehiculos/swagger", "/vehiculos/swagger-ui.html"],
    "strip_path": false,
    "tags": ["docs"]
  }' 2>/dev/null

# ============================
# PERSONAS
# ============================
echo "👥 Registrando Personas..."

curl -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "personas-service",
    "url": "http://personas:3001",
    "tags": ["parqueadero"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/personas-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "personas-api",
    "paths": ["/personas"],
    "strip_path": true,
    "tags": ["personas"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/personas-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "personas-swagger",
    "paths": ["/personas/swagger", "/personas/swagger-ui.html"],
    "strip_path": false,
    "tags": ["docs"]
  }' 2>/dev/null

# ============================
# ZONAS
# ============================
echo "📍 Registrando Zonas..."

curl -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "zonas-service",
    "url": "http://zonas:8080",
    "tags": ["parqueadero"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/zonas-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "zonas-api",
    "paths": ["/zonas"],
    "strip_path": true,
    "tags": ["zonas"]
  }' 2>/dev/null

curl -X POST "$KONG_ADMIN/services/zonas-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "zonas-swagger",
    "paths": ["/zonas/swagger-ui.html", "/zonas/v3/api-docs"],
    "strip_path": false,
    "tags": ["docs"]
  }' 2>/dev/null

# ============================
# PLUGINS GLOBALES CORS
# ============================
echo "🔌 Configurando plugins..."

# CORS en Asignación
curl -X POST "$KONG_ADMIN/services/asignacion-service/plugins" \
  -H "Content-Type: application/json" \
  -d '{"name": "cors", "config": {"origins": ["*"], "credentials": true}}' 2>/dev/null

# CORS en Vehículos
curl -X POST "$KONG_ADMIN/services/vehiculos-service/plugins" \
  -H "Content-Type: application/json" \
  -d '{"name": "cors", "config": {"origins": ["*"], "credentials": true}}' 2>/dev/null

# CORS en Personas
curl -X POST "$KONG_ADMIN/services/personas-service/plugins" \
  -H "Content-Type: application/json" \
  -d '{"name": "cors", "config": {"origins": ["*"], "credentials": true}}' 2>/dev/null

# CORS en Zonas
curl -X POST "$KONG_ADMIN/services/zonas-service/plugins" \
  -H "Content-Type: application/json" \
  -d '{"name": "cors", "config": {"origins": ["*"], "credentials": true}}' 2>/dev/null

echo "✅ Kong configurado exitosamente!"
echo ""
echo "🌐 URLs disponibles:"
echo "  Asignación:   http://localhost:8000/api/asignaciones"
echo "  Vehículos:    http://localhost:8000/vehiculos"
echo "  Personas:     http://localhost:8000/personas"
echo "  Zonas:        http://localhost:8000/zonas"
echo ""
echo "📚 Swagger disponible en:"
echo "  Asignación:   http://localhost:8000/asignacion/swagger-ui.html"
echo "  Vehículos:    http://localhost:8000/vehiculos/swagger"
echo "  Personas:     http://localhost:8000/personas/swagger"
echo "  Zonas:        http://localhost:8000/zonas/swagger-ui.html"
echo ""
echo "Kong Admin: http://localhost:8001"
echo "Kong Manager: http://localhost:8002"
