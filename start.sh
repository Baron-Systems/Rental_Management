#!/bin/bash

# Rental Management - Self-Contained Build & Start Script
# Usage: chmod +x start.sh && ./start.sh

set -e

# Detect if we are in the parent folder
if [ -d "Rental_Management" ]; then
  cd Rental_Management
fi

echo "========================================"
echo "    Rental Management - Build & Start"
echo "========================================"
echo ""

# ---------- Database Setup ----------
DB_USER="rental_user"
DB_PASS="rental_pass"
DB_NAME="rental_management"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"

echo "[1/7] Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo "  -> PostgreSQL not found, installing..."
  apt-get update
  apt-get install -y postgresql postgresql-contrib
else
  echo "  -> PostgreSQL already installed"
fi

echo "[2/7] Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

sleep 2

echo "[3/7] Creating database and user..."
sudo -u postgres psql <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;

ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

# Ensure .env exists with DATABASE_URL
if [ ! -f ".env" ]; then
  echo "[4/7] Creating .env file..."
  touch .env
fi

if ! grep -q "DATABASE_URL" .env; then
  echo "DATABASE_URL=\"${DB_URL}\"" >> .env
  echo "  -> Added DATABASE_URL to .env"
else
  echo "  -> DATABASE_URL already exists in .env"
fi

# ---------- App Setup ----------
echo "[5/7] Installing dependencies..."
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "  -> node_modules found, skipping install"
fi

echo "[6/7] Generating Prisma client..."
npx prisma generate

echo "[7/7] Applying database migrations..."
npx prisma migrate deploy

echo "[7/7] Seeding default data..."
npx prisma db seed || true

echo "[7/7] Building Next.js..."
npm run build

# ---------- Start Server ----------
echo ""
echo "========================================"
echo "  App ready at: http://localhost:54123"
echo "  Default login:"
echo "    Email:    admin@rental.com"
echo "    Password: admin123"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop"
echo ""

PORT=54123 npm start
