Write-Host "Deteniendo contenedor..."
docker stop postgres-db

Write-Host "Eliminando contenedor..."
docker rm postgres-db

Write-Host "Eliminando volumen (borra todos los datos)..."
docker volume rm parqueadero_postgres_data

Write-Host "Levantando docker nuevamente..."
docker compose up -d

Write-Host "Listo. Base de datos reiniciada limpia."
