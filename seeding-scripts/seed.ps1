# Seed mock data into the Docker Postgres, then clear cached reports in the Docker Redis.
# Run from anywhere while `docker compose up` is running:  .\seeding-scripts\seed.ps1
$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
  Get-Content seeding-scripts/seed.sql -Raw | docker compose exec -T postgres psql -U sweety -d sweety
  if ($LASTEXITCODE -ne 0) { throw 'Seeding failed.' }
  docker compose exec -T redis redis-cli FLUSHDB
} finally {
  Pop-Location
}
