# Migrating apnafastag.com from Railway to AWS EC2

Target: one EC2 instance in **ap-south-1 (Mumbai)** running the whole stack via
Docker Compose. Cloudflare stays in front exactly as today.

```
Cloudflare (DNS + proxy) → EC2 Elastic IP → Caddy :443 → frontend :8080 → backend :8000 → MongoDB
```

Estimated cost: **t4g.small (2 vCPU / 2 GB) ≈ $12–13/mo + 30 GB gp3 disk ≈ $2.6/mo**.
Elastic IP is free while attached.

## 0. Prerequisites

- [ ] Production env values copied out of Railway (backend service → Variables).
- [ ] Know where production MongoDB lives:
  - **MongoDB Atlas** → nothing to migrate; just allow the EC2 IP in Atlas
    Network Access and reuse the same `MONGO_URL`.
  - **Railway Mongo service** → migrate first (see §4).

## 1. Provision (one-time)

```bash
# key pair
aws ec2 create-key-pair --key-name apnafastag --region ap-south-1 \
  --query 'KeyMaterial' --output text > ~/.ssh/apnafastag.pem && chmod 400 ~/.ssh/apnafastag.pem

# security group: SSH (your IP only), HTTP, HTTPS
aws ec2 create-security-group --group-name apnafastag-web --description "apnafastag web" --region ap-south-1
aws ec2 authorize-security-group-ingress --group-name apnafastag-web --region ap-south-1 \
  --protocol tcp --port 22 --cidr YOUR_IP/32
aws ec2 authorize-security-group-ingress --group-name apnafastag-web --region ap-south-1 \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name apnafastag-web --region ap-south-1 \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# instance: Ubuntu 24.04 ARM, t4g.small, 30 GB gp3
aws ec2 run-instances --region ap-south-1 \
  --image-id <latest ubuntu-24.04 arm64 AMI> \
  --instance-type t4g.small --key-name apnafastag \
  --security-groups apnafastag-web \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=30,VolumeType=gp3}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=apnafastag}]'

# elastic IP
aws ec2 allocate-address --region ap-south-1
aws ec2 associate-address --region ap-south-1 --instance-id i-XXX --allocation-id eipalloc-XXX
```

## 2. Server setup

```bash
ssh -i ~/.ssh/apnafastag.pem ubuntu@<ELASTIC_IP>
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu   # re-login after this

git clone https://github.com/ApnaPayment/FASTAGSATHI.git app
cd app/deploy
cp .env.example .env && nano .env    # paste production values from Railway
docker compose up -d --build
```

Sanity check from your laptop (before touching DNS):

```bash
curl -s -H "Host: apnafastag.com" http://<ELASTIC_IP>/api/banks | head -c 200
```

## 3. DNS cutover (Cloudflare)

1. Edit the `apnafastag.com` CNAME → change it to an **A record → \<ELASTIC_IP\>**,
   set it to **DNS only (grey cloud)** for now.
2. Also point `www` at the same IP (A record).
3. Wait ~2 min; Caddy will obtain Let's Encrypt certificates automatically on
   first request.
4. Verify `https://apnafastag.com` works, then flip both records back to
   **Proxied (orange)**. Keep Cloudflare SSL mode = **Full**.
5. Rollback at any moment = point DNS back at Railway's CNAME target.

## 4. MongoDB (only if it currently lives on Railway)

```bash
mongodump --uri "$RAILWAY_MONGO_URL" --out dump/
mongorestore --uri "$NEW_MONGO_URL" dump/
```

Recommended target: **MongoDB Atlas M0/Flex in ap-south-1** (managed backups,
no extra load on the EC2 box). Update `MONGO_URL` in `deploy/.env`, then
`docker compose restart backend`.

## 5. Uploads (backend disk files)

Live avatars are currently external/seeded URLs and bank logos are stored
base64 in Mongo, so there is likely nothing to copy. If Railway has a volume
with real files: Railway dashboard → backend service → use `railway run` or a
one-off `tar` over SSH to fetch `/app/uploads`, then copy into the compose
volume: `docker cp uploads/. deploy-backend-1:/app/uploads/`.

## 6. Decommission Railway (after 48h of stable AWS traffic)

- [ ] GSC: confirm crawl stats show no 5xx spike after cutover.
- [ ] Delete the two Railway services (or pause them first).
- [ ] `robots.txt` / sitemaps need no changes — the domain stays the same.

## Deploying updates (replaces Railway auto-deploy)

```bash
ssh -i ~/.ssh/apnafastag.pem ubuntu@<ELASTIC_IP> \
  'cd app && git pull && cd deploy && docker compose up -d --build'
```

Optional later: a GitHub Action that runs the command above on every push to
`main` (mirrors the Railway experience).
