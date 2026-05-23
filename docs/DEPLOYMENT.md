# Deployment

Self-hosted on a single Hetzner Cloud VPS via Docker Compose. Caddy fronts a
Medusa backend and a Next.js + Payload storefront; Postgres, Redis, and MinIO
run alongside as data services. Images are built in GitHub Actions and
published to GHCR; the VPS pulls them and rolls the stack.

The two cross-app keys (Medusa publishable key, Payload user API key) live in
their own apps' databases — there is no env-var coupling between the two
apps. Configuration is a 4-paste flow in the two admin UIs, done once after
the first deploy.

---

## 1. Provision the VPS

- Hetzner Cloud → Create server → CX22 minimum (2 vCPU / 4 GB / 40 GB).
- Image: Ubuntu 24.04.
- Add your SSH key.
- After boot, log in as root and:

  ```bash
  apt update && apt upgrade -y
  apt install -y docker.io docker-compose-plugin curl
  adduser --disabled-password --gecos "" deploy
  usermod -aG docker deploy
  install -d -o deploy -g deploy /opt/machxi
  ```

- Open the firewall: ports 22, 80, 443. Block everything else.

## 2. DNS

Point three A records at the VPS public IP:

| Record               | Type | Target            |
| -------------------- | ---- | ----------------- |
| `yourdomain.com`     | A    | `<vps-ip>`        |
| `www.yourdomain.com` | A    | `<vps-ip>`        |
| `api.yourdomain.com` | A    | `<vps-ip>`        |
| `cdn.yourdomain.com` | A    | `<vps-ip>` *(optional, for public MinIO)* |

Caddy will request Let's Encrypt certificates for all three on first request.

## 3. Drop the deploy artifacts onto the VPS

As the `deploy` user, place these four files under `/opt/machxi/`:

```
/opt/machxi/
├── docker-compose.yml      # copy of docker/prod/docker-compose.yml
├── Caddyfile               # copy of docker/prod/Caddyfile
├── .env                    # copy of docker/prod/.env.example with real values
└── scripts/
    └── deploy.sh           # copy of scripts/deploy.sh
```

Fill in `.env` — at minimum:

- `BACKEND_IMAGE` / `STOREFRONT_IMAGE` — your GHCR namespace
- `DOMAIN_STOREFRONT`, `DOMAIN_API`, `DOMAIN_CDN`, `ADMIN_EMAIL`
- `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`,
  `PAYLOAD_SECRET`, `PAYLOAD_PREVIEW_SECRET` — long random strings each
- `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` — production origins, no localhost
- `S3_FILE_URL` — public URL where uploaded media will be served (typically
  `https://cdn.yourdomain.com/medusa-uploads`)

## 4. Wire up CI/CD

Add three secrets to the GitHub repo (`Settings → Secrets and variables →
Actions`):

| Secret         | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| `VPS_HOST`     | Hetzner public IP                                           |
| `VPS_USER`     | `deploy`                                                    |
| `VPS_SSH_KEY`  | Private SSH key matching `~deploy/.ssh/authorized_keys` on the VPS |

GHCR authentication uses the built-in `GITHUB_TOKEN` — no extra secret needed.

The repo also needs `Settings → Actions → General → Workflow permissions →
Read and write permissions` checked, so the build workflow can push to GHCR.

## 5. First deploy

Trigger the `Build & push images` workflow on `main` (or push a commit to
main). It builds `machxi-backend` and `machxi-storefront` images in parallel
and pushes them to GHCR.

Then trigger `Deploy to Hetzner` manually for the very first run. Subsequent
deploys fire automatically when the build workflow succeeds on `main`.

The deploy script runs migrations + the idempotent seed, then brings up the
app tier. The stack is live but the storefront will show a clear "publishable
key not configured" error until the next step.

## 6. One-time admin setup (~2 minutes)

This wires the two apps to each other. Do it once; the values persist in the
respective databases across redeploys.

1. **Create a Medusa admin user** — on the VPS:

   ```bash
   docker compose exec backend node_modules/.bin/medusa user --email you@yourdomain.com --invite
   ```

2. **Create a Payload admin user** — visit `https://yourdomain.com/admin`
   and follow the first-run form. Payload auto-creates the user collection.

3. **Wire publishable key (Medusa → Payload):**
   - In Medusa admin (`https://api.yourdomain.com/app`), go to
     `Settings → Publishable API Keys`, copy the default `pk_…` value.
   - In Payload admin, open `Globals → Medusa Integration`, paste the value
     into `publishableKey`, save.

4. **Wire API key (Payload → Medusa):**
   - In Payload admin, open `Users → your user`, toggle
     `Enable API Key`, save. Payload regenerates the key on save — copy it.
   - In Medusa admin, open `Settings → Payload CMS`, paste the key into
     `Payload user API key`, save.

The storefront now renders the catalog and product creates in Medusa sync
to Payload via the Redis event bus.

## 7. Rolling deploys

Push to `main` → CI builds → CI deploys. Zero downtime is not guaranteed in
this single-container topology, but the migration step runs before the new
backend container starts, so DB schema changes don't kill the old version
in-flight.

## 8. Rollback

Each image is tagged with `sha-<commit>`. To roll back:

```bash
ssh deploy@<vps-ip>
cd /opt/machxi
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=sha-abc1234/' .env
bash scripts/deploy.sh
```

Or trigger `Deploy to Hetzner` with the previous SHA in the
`image_tag` input.

## 9. Backups

Volumes that need backup:

- `pg-data` — both Medusa and Payload databases
- `minio-data` — uploaded media

A simple cron-on-VPS dump pattern:

```bash
# /etc/cron.daily/machxi-backup
docker compose -f /opt/machxi/docker-compose.yml exec -T postgres \
  pg_dumpall -U "$POSTGRES_USER" | gzip > /backups/pg-$(date +%F).sql.gz
docker compose -f /opt/machxi/docker-compose.yml exec -T minio \
  tar czf - /data > /backups/minio-$(date +%F).tar.gz
```

Ship `/backups/` off-host (Hetzner Storage Box, S3, B2) before rotating.

## Operational notes

- **Worker mode**: `MEDUSA_WORKER_MODE=shared` (default). Bumping to
  `worker` and running a second backend container with admin disabled
  separates HTTP traffic from background work. Same image, same Redis.
- **Cache rotation**: changing the publishable key in Payload triggers
  `revalidateTag('medusa-integration')` via the global's `afterChange` hook,
  so the storefront picks up the new value within a few seconds.
- **Settings cache**: the Medusa Payload module caches its DB-backed
  settings in-memory for 60 seconds; the admin "Save" API route calls
  `clearSettingsCache()` so changes take effect immediately on that process.
  Other workers in shared mode pick up the change within 60s.
- **Sharp on Alpine**: prebuilt for musl in `node:20-alpine`, so the
  Dockerfile works as-is. If you see "Could not load the sharp module"
  errors, switch the base to `node:20-bookworm-slim`.
