#!/bin/bash
set -euo pipefail

# Runs once on first container start (empty data directory). The default
# POSTGRES_USER/POSTGRES_DB are created by the official entrypoint; this
# script adds the secondary databases owned by the same user.

create_db() {
  local db="$1"
  echo "Creating database '$db' owned by '$POSTGRES_USER'..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    SELECT 'CREATE DATABASE "$db" OWNER "$POSTGRES_USER"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
}

create_db "${POSTGRES_MEDUSA_DB:-medusa}"
create_db "${POSTGRES_PAYLOAD_DB:-payload}"
