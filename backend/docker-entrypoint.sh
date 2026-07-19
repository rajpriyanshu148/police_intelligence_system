#!/bin/sh
set -eu

echo "Applying database migrations..."
alembic upgrade head

# Optional first-install bootstrap. Leave all BOOTSTRAP_ADMIN_* values unset
# after the first deployment; the seed command never overwrites an account.
if [ -n "${BOOTSTRAP_ADMIN_USERNAME:-}" ]; then
    : "${BOOTSTRAP_ADMIN_EMAIL:?BOOTSTRAP_ADMIN_EMAIL is required}"
    : "${BOOTSTRAP_ADMIN_BADGE_NUMBER:?BOOTSTRAP_ADMIN_BADGE_NUMBER is required}"
    : "${BOOTSTRAP_ADMIN_PASSWORD:?BOOTSTRAP_ADMIN_PASSWORD is required}"

    python scripts/seed_admin.py \
        --username "$BOOTSTRAP_ADMIN_USERNAME" \
        --email "$BOOTSTRAP_ADMIN_EMAIL" \
        --badge-number "$BOOTSTRAP_ADMIN_BADGE_NUMBER" \
        --department "${BOOTSTRAP_ADMIN_DEPARTMENT:-Administration}" \
        --password "$BOOTSTRAP_ADMIN_PASSWORD"
fi

exec "$@"
