#!/bin/bash

echo "🧹 Limpiando Docker y reconstruyendo..."
echo ""

# Detener servicios
echo "⏹️  Deteniendo servicios..."
docker-compose down

echo ""
echo "🗑️  Limpiando Docker..."
# Limpiar build cache, imágenes y volúmenes
docker system prune -a -f --volumes

echo ""
echo "🔨 Reconstruyendo imágenes..."
# Reconstruir todas las imágenes
docker-compose up --build -d

echo ""
echo "⏳ Esperando a que los servicios inicien..."
sleep 15

echo ""
echo "✅ Estado de los servicios:"
docker-compose ps

echo ""
echo "🔍 Verificando health checks..."
echo ""

echo "Tickets (3003):"
curl -s http://localhost:3003/health | jq . 2>/dev/null || echo "❌ No responde"

echo ""
echo "Personas (3001):"
curl -s http://localhost:3001/health | jq . 2>/dev/null || echo "❌ No responde"

echo ""
echo "Vehículos (3000):"
curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "❌ No responde"

echo ""
echo "Asignación (3002):"
curl -s http://localhost:3002/api/asignaciones/health | jq . 2>/dev/null || echo "❌ No responde"

echo ""
echo "✨ ¡Reconstrucción completada!"
echo ""
echo "🌐 URLs disponibles:"
echo "  - Kong Gateway: http://localhost:8000"
echo "  - Personas API: http://localhost:3001/swagger"
echo "  - Vehículos API: http://localhost:3000/swagger"
echo "  - Tickets API: http://localhost:3003/swagger"
echo "  - Asignación API: http://localhost:3002/swagger"
