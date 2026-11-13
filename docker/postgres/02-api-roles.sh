#!/bin/sh
# Database roles for PostgREST (runs once, after 01-schema.sql).
#   authenticator - the login PostgREST connects as (password = POSTGRES_PASSWORD)
#   sweety_api    - the role every request runs as; full CRUD on the app tables.
# PostgREST is only reachable inside the Docker network; the backend enforces ownership in code.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v pw="$POSTGRES_PASSWORD" <<'SQL'
create role sweety_api nologin;
grant usage on schema public to sweety_api;
grant select, insert, update, delete on all tables in schema public to sweety_api;
grant usage, select on all sequences in schema public to sweety_api;
alter default privileges in schema public grant select, insert, update, delete on tables to sweety_api;
alter default privileges in schema public grant usage, select on sequences to sweety_api;

create role authenticator login noinherit password :'pw';
grant sweety_api to authenticator;
SQL
