# En docker-compose.yml el sitio estático se sirve montando ./app y
# nginx-no-cache.conf como bind mounts sobre la imagen base nginx:alpine --
# válido para desarrollo local, pero un Deployment de Kubernetes necesita una
# imagen autocontenida (no hay acceso al filesystem del host). Este Dockerfile
# empaqueta lo mismo que ya sirve docker-compose, sin cambiar su contenido.
FROM nginx:alpine

COPY app/ /usr/share/nginx/html/
COPY nginx-no-cache.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
