# AIPAS production deployment

This stack publishes only Caddy on ports 80 and 443. PostgreSQL, FastAPI, and
the frontend Nginx container are isolated on an internal Docker network.

## Prerequisites

- A Linux VPS with Docker Engine and Docker Compose plugin installed.
- A domain name with an A (and, if used, AAAA) record pointing to the server.
- Ports 80 and 443 allowed by the server firewall and cloud security group.

## First deployment

1. Copy this project to the server and enter its directory.
2. Create the private production environment file:

   ```bash
   cp .env.production.example .env.production
   chmod 600 .env.production
   ```

3. Edit `.env.production` and replace every placeholder. Set `CADDY_DOMAIN`
   and `CORS_ORIGINS` to the real domain. Generate the JWT secret with
   `openssl rand -hex 32`.
4. Build and start the stack:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   ```

5. Verify it:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml ps
   docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=100 backend
   ```

Open `https://<CADDY_DOMAIN>`. The first deployment creates the bootstrap
administrator. Immediately sign in, change that password, then remove every
`BOOTSTRAP_ADMIN_*` entry from `.env.production` and run the command in step 4
again.

## Updates and backups

Deploy an update with the same `up -d --build` command. The backend runs
Alembic migrations before each start. Back up PostgreSQL before updates:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > aipas-backup.sql
```

Never commit `.env.production`, backups, or real credentials.
