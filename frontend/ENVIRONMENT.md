# AIPAS Frontend Environment Configuration

The AIPAS frontend uses environment variables prefixed with `VITE_` to ensure they are compiled and made available at runtime via Vite.

---

## Environment Variable Reference

| Variable Name | Environment | Description | Default Value |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Dev / Prod | Base URL path or host domain for backend FastAPI routes. | `/api/v1` (Vite Proxy) |
| `NODE_ENV` | All | Specifies runtime build context (development, production, test). | `development` |

---

## Configuration Files

Vite resolves environment variables using the following priority order:
1. `.env.production` (Production builds)
2. `.env.development` (Development server)
3. `.env` (Fallback configuration)

### Local Dev Defaults (`.env.development`)
```ini
NODE_ENV=development
VITE_API_URL=/api/v1
```

### Production Defaults (`.env.production`)
```ini
NODE_ENV=production
VITE_API_URL=/api/v1
```

---

## Accessing Variables in Code

Within the application, access environment variables using `import.meta.env`:

```typescript
const apiHostUrl = import.meta.env.VITE_API_URL;
```
