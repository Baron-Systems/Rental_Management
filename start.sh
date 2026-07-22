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

# Step 1: Install dependencies
echo "[1/5] Installing dependencies..."
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "  -> node_modules found, skipping install"
fi

# Step 2: Generate Prisma Client
echo "[2/5] Generating Prisma client..."
npx prisma generate

# Step 3: Apply database migrations
echo "[3/5] Applying database migrations..."
npx prisma migrate deploy

# Step 4: Seed database (safe - uses upsert)
echo "[4/5] Seeding default data..."
npx prisma db seed || true

# Step 5: Build Next.js
echo "[5/5] Building Next.js..."
npm run build

# Start server on custom port
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
