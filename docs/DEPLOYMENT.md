# Deployment

Self-hosted on a single VPS (Contabo / Hetzner / any Linux box) via Docker
Compose. Caddy fronts a Medusa backend (split into HTTP server + worker) and
a Next.js + Payload storefront; Postgres and Redis run alongside. Media lives
in external S3-compatible Object Storage (Contabo Object Storage, Cloudflare
R2, or AWS S3) — not on the VPS disk. Images are built in GitHub Actions and
published to GHCR; the VPS pulls them and rolls the stack.

The two cross-app keys (Medusa publishable key, Payload user API key) live in
their own apps' databases — there is no env-var coupling between the two
apps. Configuration is a 4-paste flow in the two admin UIs, done once after
the first deploy.

**Container layout in prod:**

| Container | What it does | Exposed |
|---|---|---|
| `postgres` | Two DBs: `medusa`, `payload` | internal only |
| `redis` | BullMQ + cache, `noeviction` policy | internal only |
| `backend` | Medusa HTTP server (`MEDUSA_WORKER_MODE=server`) | via Caddy → `api.yourdomain.com` |
| `backend-worker` | Medusa BullMQ workers + subscribers + scheduled jobs (`MEDUSA_WORKER_MODE=worker`) | internal only |
| `storefront` | Next.js + embedded Payload | via Caddy → `yourdomain.com` |
| `caddy` | TLS + reverse proxy | host ports 80/443 |

---

## 1. Provision the VPS

**Recommended:** Contabo VPS-S (4 vCPU / 8 GB / 75 GB NVMe) — fits everything
comfortably with Object Storage offloading media. VPS-M (6 vCPU / 12 GB) if
you want extra headroom. Hetzner CX22 also works.

- Image: Ubuntu 24.04 LTS.
- Add your SSH key during creation.
- After boot, log in as root and:

  ```bash
  apt update && apt upgrade -y
  apt install -y docker.io docker-compose-plugin curl ufw
  adduser --disabled-password --gecos "" deploy
  usermod -aG docker deploy
  install -d -o deploy -g deploy /opt/machxi /opt/machxi/scripts
  ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
  ufw --force enable
  ```

  (Hetzner has a cloud firewall in the panel as an alternative to `ufw`.
  Contabo doesn't — `ufw` is your firewall.)

## 2. Object Storage

You need an S3-compatible bucket for each app (`medusa-uploads` and
`payload-uploads`). Contabo Object Storage works well, Cloudflare R2 is free
up to 10 GB and integrates naturally with the Cloudflare CDN, AWS S3 is the
classic choice.

**Contabo Object Storage steps:**

1. Customer Control Panel → Object Storage → create an instance in a region
   close to your VPS (e.g. EU Central).
2. Within the instance, create two buckets: `medusa-uploads` and
   `payload-uploads`. Set both to **public read** (you'll serve images
   directly to browsers via the CDN).
3. Generate access credentials (Access Key + Secret).
4. Note the endpoint URL — typically `https://<region>.contabostorage.com`
   (e.g. `https://eu2.contabostorage.com`).
5. Set bucket CORS to allow your storefront origin:
   ```json
   { "CORSRules": [{
       "AllowedOrigins": ["https://yourdomain.com"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
   }]}
   ```

**Cloudflare R2 steps** (alternative): R2 dashboard → Create bucket
(separately for each), generate an API token with R2 read/write, endpoint is
`https://<account-id>.r2.cloudflarestorage.com`. Same env shape.

## 3. DNS (via Cloudflare)

Point three records at the VPS public IP. The `cdn` record is special: CNAME
it at your bucket endpoint, **not** at your VPS — Cloudflare proxies and
caches the bucket directly so the VPS bandwidth is reserved for API + page
traffic.

| Record               | Type  | Target                                          | Cloudflare proxy |
| -------------------- | ----- | ----------------------------------------------- | ---------------- |
| `yourdomain.com`     | A     | `<vps-ip>`                                      | yes (orange)     |
| `www.yourdomain.com` | A     | `<vps-ip>`                                      | yes (orange)     |
| `api.yourdomain.com` | A     | `<vps-ip>`                                      | yes (orange)     |
| `cdn.yourdomain.com` | CNAME | `eu2.contabostorage.com` (or R2 / S3 endpoint) | yes (orange)     |

Caddy issues Let's Encrypt certs for the first three on first request. The
`cdn` subdomain is served by your object storage provider through
Cloudflare — no Caddy involvement.

If your storage provider blocks cross-host CNAMEs without verification
(R2 requires "Custom Domains" setup in the R2 dashboard; Contabo accepts
proxied CNAMEs as-is), follow their custom-domain instructions before
flipping the orange cloud on.

## 4. Drop the deploy artifacts onto the VPS

As the `deploy` user, place these files under `/opt/machxi/`:

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
- `IMAGE_TAG=latest` (CI will roll this for you)
- `DOMAIN_STOREFRONT`, `DOMAIN_API`, `ADMIN_EMAIL`
- `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`, `PAYLOAD_SECRET`,
  `PAYLOAD_PREVIEW_SECRET` — long random strings each
- `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` — production origins, no localhost
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET_MEDUSA`, `S3_BUCKET_PAYLOAD`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — from §2
- `S3_FILE_URL=https://cdn.yourdomain.com/medusa-uploads` — your CDN URL
  for Medusa uploads

## 5. Wire up CI/CD

Add three secrets to the GitHub repo (`Settings → Secrets and variables →
Actions`):

| Secret         | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| `VPS_HOST`     | VPS public IP                                               |
| `VPS_USER`     | `deploy`                                                    |
| `VPS_SSH_KEY`  | Private SSH key matching `~deploy/.ssh/authorized_keys` on the VPS |

GHCR authentication uses the built-in `GITHUB_TOKEN` — no extra secret needed.

The repo also needs `Settings → Actions → General → Workflow permissions →
Read and write permissions` checked, so the build workflow can push to GHCR.

## 6. First deploy

Trigger the `Build & push images` workflow on `main` (or push a commit to
main). It builds `machxi-backend` and `machxi-storefront` images in parallel
and pushes them to GHCR.

Then trigger `Deploy to VPS` manually for the very first run. Subsequent
deploys fire automatically when the build workflow succeeds on `main`.

The deploy script runs migrations, then brings up `backend`, `backend-worker`,
`storefront`, and `caddy`. The stack is live but the storefront will show a
clear "publishable key not configured" error until the next step.

## 7. One-time admin setup (~2 minutes)

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
to Payload via the Redis event bus (server posts the job, worker container
runs the sync).

## 8. Rolling deploys

Push to `main` → CI builds → CI deploys. The migration step runs before any
new container starts, so DB schema changes don't kill in-flight requests
served by the old backend.

## 9. Rollback

Each image is tagged with `sha-<commit>`. To roll back:

```bash
ssh deploy@<vps-ip>
cd /opt/machxi
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=sha-abc1234/' .env
bash scripts/deploy.sh
```

Or trigger `Deploy to VPS` with the previous SHA in the `image_tag` input.

## 10. Backups

Volumes that need backup:

- `pg-data` — both Medusa and Payload databases. **Critical.**
- `caddy-data` — Let's Encrypt certs. Recoverable (re-issued automatically
  on cert renewal), but losing them triggers ACME rate limits if you re-up
  the stack many times in 7 days.

Object Storage buckets are replicated by your provider — no separate backup
needed unless you want a second-region copy.

A simple cron-on-VPS dump pattern:

```bash
# /etc/cron.daily/machxi-backup
docker compose -f /opt/machxi/docker-compose.yml exec -T postgres \
  pg_dumpall -U "$POSTGRES_USER" | gzip > /backups/pg-$(date +%F).sql.gz
```

Ship `/backups/` off-host (Hetzner Storage Box, Cloudflare R2, B2) before
rotating.

## Operational notes

- **Worker scaling**: `backend-worker` runs all subscribers + BullMQ jobs +
  scheduled jobs. If background work grows, scale it with
  `docker compose up -d --scale backend-worker=2` — they coordinate via
  Redis. Don't scale `backend` (HTTP) the same way unless you also add a
  load balancer in front; Caddy points at a single backend container by name.
- **Cache rotation**: changing the publishable key in Payload triggers
  `revalidateTag('medusa-integration')` via the global's `afterChange` hook,
  so the storefront picks up the new value within a few seconds.
- **Settings cache**: the Medusa Payload module caches its DB-backed
  settings in-memory for 60 seconds; the admin "Save" API route calls
  `clearSettingsCache()` so changes take effect immediately on the server
  container. The worker picks them up within 60 s.
- **Object Storage failover**: if Contabo Object Storage has an outage, new
  uploads fail and existing images served direct from the bucket are
  unavailable. Cloudflare in front absorbs the read side (cached images
  served from edge) for hours; uploads are still blocked.
- **Sharp on Alpine**: prebuilt for musl in `node:20-alpine`, so the
  Dockerfile works as-is. If you see "Could not load the sharp module"
  errors, switch the base to `node:20-bookworm-slim`.
- **In-container `medusa db:migrate` hang**: on Windows Docker Desktop the
  command hangs after Redis modules initialize. The local launcher
  (`pnpm docker:prod:local`) works around it by migrating from the host
  against the exposed postgres port. On real Linux VPS deploys this
  doesn't reproduce — `scripts/deploy.sh` runs migrate normally inside the
  `backend` container.
