# Despliegue en Kubernetes (Minikube)

Carpeta de práctica lista para usar: **el Secret real ya está incluido**
(`02-secrets.local.yml`), no hace falta generarlo. Los archivos están sueltos
en esta carpeta (no dentro de `deployment/`), así que los comandos de abajo
usan rutas relativas a esta misma carpeta.

## 1. Build de imágenes (Minikube usa su propio daemon Docker interno)

Este paso se corre desde la raíz del proyecto completo (donde están
`back-end/` y `front-end/`), no desde esta carpeta:

```bash
minikube start --driver=docker
minikube addons enable ingress

minikube image build -t personas:latest ./back-end/personas
minikube image build -t vehiculos:latest ./back-end/vehiculos
minikube image build -t zonas:latest ./back-end/zonas
minikube image build -t ms-tickets:latest ./back-end/ms-tickets
minikube image build -t ms-audit:latest ./back-end/ms-audit
minikube image build -t asignacion-trazabilidad:latest ./back-end/asignacion-trazabilidad
minikube image build -t frontend:latest ./front-end
```

Si `minikube image build` falla (bug conocido en algunos entornos), usar en su lugar:
```bash
minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker build -t <nombre>:latest ./<carpeta>
```

## 2. Aplicar todo (parado dentro de esta carpeta)

```bash
kubectl apply -f 01-namespace.yml
kubectl apply -f 02-secrets.local.yml
kubectl apply -f 03-rabbitmq.yml \
  -f 04-kong-db.yml \
  -f 05-kong.yml \
  -f 06-kong-setup-job.yml \
  -f 07-personas.yml \
  -f 08-vehiculos.yml \
  -f 09-zonas.yml \
  -f 10-ms-tickets.yml \
  -f 11-ms-audit.yml \
  -f 12-asignacion-trazabilidad.yml \
  -f 13-frontend.yml \
  -f 14-frontend-ingress.yml

kubectl get pods -n parqueadero
```

## 3. Acceso

```bash
minikube tunnel   # deja Kong (LoadBalancer) en localhost:8000 y el Ingress en 127.0.0.1:80
```

Agregar a `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 parking.espe.edu.ec
```

- Frontend: http://parking.espe.edu.ec
- API vía Kong (igual que en desarrollo local): http://localhost:8000

Las cuentas de prueba (jperez/rsystem/crecaudador/gpcaceres, password `Clave123*`)
ya existen en Supabase -- no hace falta recrearlas.

## Nota sobre el Secret incluido

`02-secrets.local.yml` trae credenciales reales (password de Supabase y
JWT secret) para que el clúster funcione sin pasos extra -- carpeta de
práctica en un repo privado, a pedido explícito para la actividad. No
reemplaza las buenas prácticas de `deployment/` en la raíz del proyecto,
donde ese archivo sí se mantiene fuera de git.
