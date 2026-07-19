"""Create the first local administrator after database migrations.

This script is deliberately idempotent: it refuses to overwrite an existing
username, email, or badge number.  Use it only for a local development or
first-install environment; production credentials must be supplied securely.
"""

import argparse
import asyncio
import getpass
import sys
from pathlib import Path

from sqlalchemy import or_, select

# Support direct execution: ``python scripts/seed_admin.py ...``.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import get_password_hash
from app.database.session import AsyncSessionLocal
from app.models.officer import Officer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create the initial AIPAS administrator.")
    parser.add_argument("--username", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--badge-number", required=True)
    parser.add_argument("--department", default="Administration")
    parser.add_argument("--password", help="Avoid this option outside local development.")
    return parser.parse_args()


async def create_admin(args: argparse.Namespace, password: str) -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(
            select(Officer).where(
                or_(
                    Officer.username == args.username,
                    Officer.email == args.email,
                    Officer.badge_number == args.badge_number,
                )
            )
        )
        if existing:
            print("An officer with these bootstrap identifiers already exists; no changes made.")
            return

        session.add(
            Officer(
                username=args.username,
                email=args.email,
                badge_number=args.badge_number,
                department=args.department,
                role="ADMIN",
                status="Active",
                password_hash=get_password_hash(password),
            )
        )
        await session.commit()


def main() -> None:
    args = parse_args()
    password = args.password or getpass.getpass("Initial admin password: ")
    if len(password) < 8:
        raise ValueError("The password must contain at least 8 characters.")
    asyncio.run(create_admin(args, password))
    print(f"Created administrator '{args.username}'.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Admin bootstrap failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
