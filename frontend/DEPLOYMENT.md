# AIPAS Frontend Production Deployment Guide

This guide explains how to compile, containerize, and deploy the AIPAS frontend application in production environments.

---

## 1. Production Docker Container Build

The application uses a multi-stage `Dockerfile`:
1. **Compilation Stage**: Boots Node 18, installs dependencies, compiles TS, and builds optimized SPA assets using Vite (`npm run build`).
2. **Serving Stage**: Boots Nginx Alpine, copies compiled assets, applies `nginx.conf` optimizations (gzip, security headers, SPA routing), and opens ports `80` & `443`.

Build the container:

```bash
docker build -t aipas-frontend:latest .
```

---

## 2. Docker Compose Configurations

Three orchestration files are provided to manage execution environments:

### Local Production Setup (`docker-compose.yml`)
To boot the production container option locally:
```bash
docker-compose up -d
```

### Production Deployment Overlay (`docker-compose.prod.yml`)
Applies persistent restart policies, production variables, and routes ports `80` & `443`:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Development Overlay (`docker-compose.dev.yml`)
Launches the container in live-reload watch mode for remote development work:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## 3. Nginx Server Configuration (`nginx.conf`)

The production Nginx setup provides:
* **SPA Routing**: Automatic fallbacks of subpaths to `index.html` to avoid `404` errors on routing.
* **API Proxying**: Paths matching `/api/` are forwarded directly to the backend service.
* **Performance Enhancements**: Enable Gzip compression for css/js text segments.
* **Security Headers**: X-Frame-Options, X-Content-Type-Options, CSP, and X-XSS-Protection.
