#!/bin/bash

# Script para configurar Kong con los servicios de la aplicación Parqueadero

# Esperar a que Kong esté listo
sleep 10

# URL del Admin API de Kong
KONG_ADMIN_URL="http://kong:8001"

# Crear el Servicio Zonas
echo "Creando servicio Zonas en Kong..."
curl -i -X POST $KONG_ADMIN_URL/services \
  --data name=zonas-service \
  --data url=http://zonas:8080

# Crear la Ruta para Zonas
echo "Creando ruta para Zonas..."
curl -i -X POST $KONG_ADMIN_URL/services/zonas-service/routes \
  --data 'paths[]=/api/zonas' \
  --data 'paths[]=/api/espacios'

# Crear el Servicio para Swagger/Docs
echo "Creando servicio para Swagger..."
curl -i -X POST $KONG_ADMIN_URL/services \
  --data name=swagger-service \
  --data url=http://zonas:8080

# Crear la Ruta para Swagger
echo "Creando ruta para Swagger..."
curl -i -X POST $KONG_ADMIN_URL/services/swagger-service/routes \
  --data 'paths[]=/swagger-ui.html' \
  --data 'paths[]=/v3/api-docs'

echo "Configuración de Kong completada!"
