#!/bin/sh
# Seed mock data into the Docker Postgres, then clear cached reports in the Docker Redis.
# Run from anywhere while `docker compose up` is running:  sh seeding-scripts/seed.sh
set -e
cd "$(dirname "$0")/.."

docker compose exec -T postgres psql -U sweety -d sweety < seeding-scripts/seed.sql
docker compose exec -T redis redis-cli FLUSHDB
