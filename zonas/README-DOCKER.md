# levantar servicio mvn

mvnw.cmd spring-boot:run

# Configuración Docker para Zonas

## Base de Datos PostgreSQL en Docker

### Iniciar la base de datos

```bash
docker-compose up -d
```

### Detener y eliminar los datos (reconstruir desde cero)

```bash
docker-compose down -v
```

### Ver logs de PostgreSQL

```bash
docker-compose logs -f postgres
```

### Configuración actual

- **Base de datos**: zonas_db
- **Usuario**: postgres
- **Contraseña**: postgres
- **Puerto**: 5432
- **Hibernate DDL**: create-drop (elimina y recrea tablas al iniciar/apagar la aplicación)

### Comandos útiles

- **Iniciar contenedor**: `docker-compose up -d`
- **Detener contenedor**: `docker-compose down`
- **Eliminar datos**: `docker-compose down -v`
- **Reconstruir**: `docker-compose up -d --build`
- **Conectar a PostgreSQL**:
  ```bash
  docker exec -it zonas_postgres psql -U postgres -d zonas_db
  ```

## Comportamiento de Hibernate

Con `ddl-auto: create-drop`:

- Al iniciar la aplicación: se eliminan y recrean todas las tablas
- Al apagar la aplicación: se eliminan todas las tablas
- Los datos NO persisten entre reinicios de la aplicación

### Otras opciones de ddl-auto:

- `create`: Crea las tablas al iniciar, no las elimina al apagar
- `update`: Actualiza el esquema sin eliminar datos
- `validate`: Solo valida que el esquema coincida
- `none`: No hace nada automáticamente
