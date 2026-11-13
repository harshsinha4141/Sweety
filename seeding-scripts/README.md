# Seeding scripts

Mock data for the Docker Postgres. Start the stack first: `docker compose up -d --build`.

| File | What it does |
|---|---|
| `seed.sql` | 2 doctors, 6 patients, and about 90 days of readings. Safe to re-run: it replaces earlier mock data only. |
| `seed.ps1` | PowerShell: runs `seed.sql` and clears cached reports in Redis |
| `seed.sh` | Same for Git Bash / Linux / macOS |

```powershell
.\seeding-scripts\seed.ps1        # PowerShell
sh seeding-scripts/seed.sh        # Git Bash / Linux / macOS
```

Or run the steps yourself:

```sh
docker compose exec -T postgres psql -U sweety -d sweety < seeding-scripts/seed.sql
docker compose exec -T redis redis-cli FLUSHDB
```

## Mock accounts

All of them use the password **Password@123**.

| Role | Email | Doctor |
|---|---|---|
| Doctor | ananya.mehta@sweety.test | |
| Doctor | vikram.rao@sweety.test | |
| Patient | rahul.sharma@sweety.test | Ananya Mehta (well controlled) |
| Patient | priya.nair@sweety.test | Ananya Mehta |
| Patient | arjun.verma@sweety.test | Ananya Mehta (often high) |
| Patient | sneha.iyer@sweety.test | Vikram Rao (sometimes low) |
| Patient | mohit.gupta@sweety.test | Vikram Rao |
| Patient | kabir.singh@sweety.test | Vikram Rao (no readings) |

## Remove the mock data

```sh
docker compose exec -T postgres psql -U sweety -d sweety -c "delete from users where email like '%@sweety.test' and role_id = 1; delete from users where email like '%@sweety.test';"
```

To wipe everything, including accounts you registered yourself, run `docker compose down -v`. The schema is recreated on the next `up`.
