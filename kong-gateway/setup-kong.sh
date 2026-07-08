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
    "paths": ["/api/api/asignaciones"],
    "strip_path": false
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
    "paths": ["/vehiculos"],
    "strip_path": false
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
    "paths": ["/personas"],
    "strip_path": false
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
    "paths": ["/api/v1/zonas"],
    "strip_path": false
  }' > /dev/null

# ============================
# TICKETS
# ============================
echo "🎫 Registrando Tickets..."

curl -s -X POST "$KONG_ADMIN/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tickets-service",
    "url": "http://ms-tickets:3003"
  }' > /dev/null

# Ruta API
curl -s -X POST "$KONG_ADMIN/services/tickets-service/routes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tickets-api",
    "paths": ["/tickets"],
    "strip_path": false
  }' > /dev/null

# ============================
# PLUGINS CORS
# ============================
echo "🔌 Agregando CORS a todos los servicios..."

for service in asignacion-service vehiculos-service personas-service zonas-service tickets-service; do
  curl -s -X POST "$KONG_ADMIN/services/$service/plugins" \
    -H "Content-Type: application/json" \
    -d '{"name": "cors", "config": {"origins": ["*"]}}' > /dev/null 2>&1
done

sleep 1

echo ""
echo "✅ Kong Gateway configurado exitosamente!"
echo ""
echo "🌐 ACCESO A TRAVÉS DE KONG (puerto 8000):"
echo "  📝 Asignación: http://localhost:8000/api/asignaciones"
echo "  🚗 Vehículos:  http://localhost:8000/vehiculos"
echo "  👥 Personas:   http://localhost:8000/personas"
echo "  📍 Zonas:      http://localhost:8000/zonas"
echo "  🎫 Tickets:    http://localhost:8000/tickets"
echo ""
echo "📚 SWAGGER DIRECTO EN PUERTOS NATIVOS:"
echo "  📝 http://localhost:3002/swagger"
echo "  🚗 http://localhost:3000/swagger"
echo "  👥 http://localhost:3001/swagger"
echo "  📍 http://localhost:8080/swagger-ui.html"
echo "  🎫 http://localhost:3003/swagger"
echo ""
echo "⚙️  ADMIN:"
echo "  Kong Admin: http://localhost:8001"
echo "  Kong Manager: http://localhost:8002"
