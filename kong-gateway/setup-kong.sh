#!/bin/bash

# Setup Kong Gateway con todos los microservicios
KONG_ADMIN="http://localhost:8001"

echo "🔧 Configurando Kong Gateway..."
sleep 2

# Limpiar rutas previas
echo "🧹 Limpiando configuración anterior..."
curl -s "$KONG_ADMIN/routes" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | while read id; do
  curl -s -X DELETE "$KONG_ADMIN/routes/$id" > /dev/null
done

# ============================
# ASIGNACIÓN Y TRAZABILIDAD
# ============================
echo "📝 Registrando Asignación y Trazabilidad..."

curl -s -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "asignacion-service",
    "url": "http://asignacion-trazabilidad:3002"
  }' > /dev/null

# Ruta API
curl -s -X POST "$KONG_ADMIN/services/asignacion-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "asignacion-api",
    "paths": ["/api/asignaciones"]
  }' > /dev/null

# Ruta Swagger
curl -s -X POST "$KONG_ADMIN/services/asignacion-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "asignacion-swagger",
    "paths": ["/asignacion"]
  }' > /dev/null

# ============================
# VEHÍCULOS
# ============================
echo "🚗 Registrando Vehículos..."

curl -s -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vehiculos-service",
    "url": "http://vehiculos:3000"
  }' > /dev/null

# Ruta API
curl -s -X POST "$KONG_ADMIN/services/vehiculos-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vehiculos-api",
    "paths": ["/vehiculos"]
  }' > /dev/null

# ============================
# PERSONAS
# ============================
echo "👥 Registrando Personas..."

curl -s -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "personas-service",
    "url": "http://personas:3001"
  }' > /dev/null

# Ruta API
curl -s -X POST "$KONG_ADMIN/services/personas-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "personas-api",
    "paths": ["/personas"]
  }' > /dev/null

# ============================
# ZONAS
# ============================
echo "📍 Registrando Zonas..."

curl -s -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "zonas-service",
    "url": "http://zonas:8080"
  }' > /dev/null

# Ruta API
curl -s -X POST "$KONG_ADMIN/services/zonas-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "zonas-api",
    "paths": ["/zonas"]
  }' > /dev/null

# ============================
# PLUGINS CORS
# ============================
echo "🔌 Agregando CORS a todos los servicios..."

for service in asignacion-service vehiculos-service personas-service zonas-service; do
  curl -s -X POST "$KONG_ADMIN/services/$service/plugins" \
    -H "Content-Type: application/json" \
    -d '{"name": "cors", "config": {"origins": ["*"]}}' > /dev/null 2>&1
done

sleep 1

echo ""
echo "✅ Kong Gateway configurado exitosamente!"
echo ""
echo "🌐 ACCESO DIRECTO A MICROSERVICIOS:"
echo "  📝 Asignación y Trazabilidad: http://localhost:8000/api/asignaciones"
echo "  🚗 Vehículos:                 http://localhost:8000/vehiculos"
echo "  👥 Personas:                  http://localhost:8000/personas"
echo "  📍 Zonas:                     http://localhost:8000/zonas"
echo ""
echo "📚 SWAGGER DOCUMENTATION:"
echo "  📝 Asignación:   http://localhost:3002/swagger"
echo "  🚗 Vehículos:    http://localhost:3000/swagger"
echo "  👥 Personas:     http://localhost:3001/swagger"
echo "  📍 Zonas:        http://localhost:8080/swagger-ui.html"
echo ""
echo "⚙️  ADMIN PANEL:"
echo "  Kong Admin API:  http://localhost:8001"
echo "  Kong Manager UI: http://localhost:8002"
echo ""
echo "✨ Todos los servicios están disponibles a través de Kong en puerto 8000"
