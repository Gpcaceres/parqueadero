# Despliegue en Kubernetes (Minikube)

Manifiestos numerados para que `kubectl apply -f deployment/` los aplique en
el orden correcto (namespace → secrets → rabbitmq/kong-db → kong → los 6
microservicios → frontend → ingress).

> **Prerrequisito:** Docker, Minikube y kubectl instalados. Si la máquina no
> los tiene, ver [instrucciones de instalación por sistema operativo](../README.md#instalación-de-las-herramientas-desde-cero)
> en el README principal antes de continuar.

## 1. Generar el Secret real (no se versiona con valores reales)

`02-secrets.yml` es una plantilla sin valores reales. Antes de aplicar, generar
la versión real (queda cubierta por `.gitignore`, patrón `deployment/*.local.yml`):

```bash
kubectl create secret generic parqueadero-secrets -n parqueadero \
  --from-literal=JWT_SECRET="<mismo valor que usa docker-compose.yml>" \
  --from-literal=SUPABASE_DB_PASSWORD="<password real de Supabase, ver .env>" \
  --dry-run=client -o yaml > deployment/02-secrets.local.yml

kubectl create secret generic kong-db-secret -n parqueadero \
  --from-literal=KONG_PG_PASSWORD="kong123" \
  --dry-run=client -o yaml >> deployment/02-secrets.local.yml
```

(El namespace debe existir antes: `kubectl apply -f deployment/01-namespace.yml`.)

## 2. Build de imágenes (Minikube usa su propio daemon Docker interno)

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

## 3. Aplicar todo (usa 02-secrets.local.yml en vez de la plantilla)

```bash
kubectl apply -f deployment/01-namespace.yml
kubectl apply -f deployment/02-secrets.local.yml
kubectl apply -f deployment/03-rabbitmq.yml \
  -f deployment/04-kong-db.yml \
  -f deployment/05-kong.yml \
  -f deployment/06-kong-setup-job.yml \
  -f deployment/07-personas.yml \
  -f deployment/08-vehiculos.yml \
  -f deployment/09-zonas.yml \
  -f deployment/10-ms-tickets.yml \
  -f deployment/11-ms-audit.yml \
  -f deployment/12-asignacion-trazabilidad.yml \
  -f deployment/13-frontend.yml \
  -f deployment/14-frontend-ingress.yml

kubectl get pods -n parqueadero
```

## 4. Acceso

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
