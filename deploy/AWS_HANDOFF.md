# AWS Migration Handoff — apnafastag.com (Railway → EC2)

Brief for the session operating the AWS account. Everything below has been
prepared and tested; your job is provisioning, first deploy, and verification.
Repo: `https://github.com/ApnaPayment/FASTAGSATHI` (branch `main`).

## Current state (verified 23 Sep 2026)

- Production runs on Railway: frontend service (Node `server.js`, port 8080,
  custom domain `apnafastag.com` via Cloudflare) + backend service (FastAPI).
- **MongoDB is on Atlas** — no data migration. Only add the new EC2 IP to
  Atlas → Network Access.
- Stack is fully containerized and tested locally as containers:
  `backend/Dockerfile`, `frontend/Dockerfile`, `deploy/docker-compose.yml`
  (backend + frontend + Caddy auto-TLS). Frontend build requires
  `--legacy-peer-deps` (already in its Dockerfile).
- `frontend/server.js` reads `BACKEND_HOST/BACKEND_PORT/BACKEND_SCHEME`;
  compose sets these to the backend container. Defaults point at Railway, so
  the same code keeps current production alive during the transition.
- A GitHub Action (`.github/workflows/deploy.yml`) auto-deploys on push to
  `main` once activated; it is currently skipped (repo variable
  `DEPLOY_ENABLED` unset).

## Target

```
Cloudflare (stays) → Elastic IP → Caddy :443 → frontend :8080 → backend :8000 → Atlas
```

Region **ap-south-1**, instance **t4g.small** (ARM), 30 GB gp3.
Approved budget ≈ $15/month. Account 746669191576.

## Step 1 — Provision

```bash
REGION=ap-south-1

# Key pair
aws ec2 create-key-pair --key-name apnafastag --region $REGION \
  --query 'KeyMaterial' --output text > ~/.ssh/apnafastag.pem
chmod 400 ~/.ssh/apnafastag.pem

# Security group (default VPC): 22 restricted, 80/443 open
SG=$(aws ec2 create-security-group --group-name apnafastag-web \
  --description "apnafastag web" --region $REGION --query GroupId --output text)
MYIP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress --group-id $SG --region $REGION \
  --protocol tcp --port 22 --cidr $MYIP/32
aws ec2 authorize-security-group-ingress --group-id $SG --region $REGION \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG --region $REGION \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Latest Ubuntu 24.04 arm64 AMI
AMI=$(aws ssm get-parameter --region $REGION \
  --name /aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id \
  --query Parameter.Value --output text)

# Instance
IID=$(aws ec2 run-instances --region $REGION --image-id $AMI \
  --instance-type t4g.small --key-name apnafastag --security-group-ids $SG \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=30,VolumeType=gp3}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=apnafastag}]' \
  --query 'Instances[0].InstanceId' --output text)
aws ec2 wait instance-running --instance-ids $IID --region $REGION

# Elastic IP
ALLOC=$(aws ec2 allocate-address --region $REGION --query AllocationId --output text)
aws ec2 associate-address --instance-id $IID --allocation-id $ALLOC --region $REGION
EIP=$(aws ec2 describe-addresses --allocation-ids $ALLOC --region $REGION \
  --query 'Addresses[0].PublicIp' --output text)
echo "ELASTIC_IP=$EIP"
```

## Step 2 — Server setup

```bash
ssh -i ~/.ssh/apnafastag.pem ubuntu@$EIP <<'EOF'
sudo apt-get update -qq && sudo apt-get install -y -qq docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
git clone https://github.com/ApnaPayment/FASTAGSATHI.git app
cp app/deploy/.env.example app/deploy/.env
EOF
```

**⛔ USER STEP — do not guess these:** the user must fill
`~/app/deploy/.env` on the server with the PRODUCTION values from
Railway → backend service → Variables (`MONGO_URL`, `JWT_SECRET`,
`ADMIN_SECRET`, `OTP_BYPASS=false`, Cashfree keys, `DB_NAME`,
`CORS_ORIGINS=https://apnafastag.com`, `FRONTEND_URL=https://apnafastag.com`).
Also: user adds the Elastic IP to **Atlas → Network Access**.

Then:

```bash
ssh -i ~/.ssh/apnafastag.pem ubuntu@$EIP 'cd app/deploy && docker compose up -d --build'
```

## Step 3 — Verify BEFORE touching DNS

```bash
# API through the whole stack (Host header simulates the real domain, port 80)
curl -s -H "Host: apnafastag.com" http://$EIP/api/banks | head -c 200   # expect JSON

# Page + bot meta injection
curl -s -H "Host: apnafastag.com" -A "Googlebot/2.1" http://$EIP/toll/khalapur-nh48 \
  | grep -o '<link rel="canonical"[^>]*>'   # expect canonical = the /toll/ URL, NOT homepage

# Hard 404 for dead slugs
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: apnafastag.com" \
  -A "Googlebot/2.1" http://$EIP/toll/does-not-exist   # expect 404
```

Do not proceed to DNS until all three pass.

## Step 4 — Cutover (user does DNS, you verify)

1. USER: Cloudflare → DNS → `apnafastag.com`: change the CNAME
   (`i15cdcsd.up.railway.app`) to **A record → $EIP**, set **DNS only (grey)**
   temporarily. Same for `www`.
2. Wait ~2–3 min; Caddy self-issues Let's Encrypt certs on first hit.
3. Verify `https://apnafastag.com/` = 200, then USER flips both records back
   to **Proxied (orange)**. Cloudflare SSL mode stays **Full**.
4. Full battery: homepage, `/join`, `/api/banks`, sitemap.xml + a sub-sitemap,
   robots.txt, bot canonical on a plaza page, trailing-slash 301
   (`/city/jaipur/` → 301), admin login.

Rollback at any point: restore the Cloudflare CNAME to
`i15cdcsd.up.railway.app` — Railway remains fully operational until
decommissioned.

## Step 5 — Activate auto-deploy

USER adds in GitHub repo (ApnaPayment/FASTAGSATHI) → Settings → Secrets and
variables → Actions:
- secret `EC2_HOST` = the Elastic IP
- secret `EC2_SSH_KEY` = contents of `~/.ssh/apnafastag.pem`
- variable `DEPLOY_ENABLED` = `true`

Push-to-main then deploys automatically (workflow already on main).

## Step 6 — Aftercare

- 48h stable → user deletes the two Railway services.
- Recommend: uptime monitor on `https://apnafastag.com/` (a 2-day outage went
  unnoticed in Aug 2026 when a Railway edge IP was retired).
- No robots/sitemap/SEO changes needed — domain is unchanged.

## Report back when done

Elastic IP, instance id, security group id, and the outputs of the Step 3 +
Step 4 verification commands.
