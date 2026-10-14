# apnafastag.com — production runbook

Live since 23 Sep 2026 on the GV Partner EC2 host (AWS account 967907105629, ap-south-1,
instance `i-07b54713706ce217e`, 3.111.85.190). Railway is decommissioned. The Docker/Caddy files
in this folder and `AWS_HANDOFF.md` describe the original plan and are **not** what runs in production.

## Layout on the server

| Piece | Where |
|---|---|
| Code (git checkout of `main`) | `/opt/apnafastag/app`, owned by system user `apnafastag` |
| Backend | systemd `apnafastag-backend` — uvicorn on 127.0.0.1:8000, venv `/opt/apnafastag/venv` |
| Frontend | systemd `apnafastag-frontend` — `node server.js` on :8080, serves `frontend/build` |
| Secrets | `/opt/apnafastag/.env` (mode 600) — never in git |
| Database | MongoDB 7.0 on the same host, 127.0.0.1:27017, auth on, db `apnafastag` |
| Web | nginx `sites-available/apnafastag.com` → :8080, behind Cloudflare (proxied, SSL mode Full) |

Both services are memory-capped and run at lower priority than the co-hosted apnapayment.com app.

## Deploying

Push to `main`. The **Deploy** GitHub Action builds the frontend, uploads it to
`s3://gvpartner/apnafastag/releases/<sha>.tgz`, and runs `/opt/apnafastag/deploy.sh <sha>` on the
server through AWS Systems Manager (document `ApnafastagDeploy`). The script checks out the backend
at that commit, installs Python packages if `backend/requirements.txt` changed, swaps in the new build,
restarts both services, and health-checks `/` and `/api/banks`. If the check fails it rolls code and
build back automatically and the Action goes red.

- Re-run a deploy: Actions → Deploy → Run workflow.
- Pause deploys: set the repository variable `DEPLOY_ENABLED` to `false`.
- Deploy log on the server: `/var/log/apnafastag-deploy.log`.
- GitHub signs in to AWS with OIDC as role `github-apnafastag-deploy`; there are no stored keys.

Frontend build settings that matter live in `frontend/.env.production` (public values only).

## Database

- Nightly backup 02:00 IST: `/usr/local/sbin/apnafastag-mongo-backup` →
  `s3://gvpartner/apnafastag/mongo-backups/` (kept 30 days) and the last 7 in `/var/backups/apnafastag-mongo`.
- Restore a backup: `mongorestore --uri="<app url from /root/.mongo-app-url>" --nsInclude='apnafastag.*' --drop --gzip --archive=<file>`.
- MongoDB 8.x does not start on this host's kernel (7.0.0, tcmalloc bug SERVER-121912); stay on 7.0 until the
  kernel is 7.0.14 or newer.

## Monitoring

Route 53 health check on `https://apnafastag.com/api/banks` every 30 s → CloudWatch alarm
`apnafastag.com DOWN` (us-east-1) → email from alerts@apnapayment.com.
