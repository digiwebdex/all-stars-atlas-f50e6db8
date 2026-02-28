# Seven Trip — Deployment Guide (Ubuntu VPS)

> Step-by-step guide to deploy the Seven Trip frontend on an Ubuntu VPS using Nginx. Written for beginners — every command is explained.

---

## Table of Contents

1. [What You Need Before Starting](#prerequisites)
2. [Server Setup (Fresh Ubuntu VPS)](#server-setup)
3. [Install Node.js](#install-nodejs)
4. [Clone and Build the Frontend](#clone-and-build)
5. [Install and Configure Nginx](#install-nginx)
6. [Set Up SSL (HTTPS) with Let's Encrypt](#setup-ssl)
7. [Deploy the Backend API](#deploy-backend)
8. [Configure Environment Variables](#configure-env)
9. [Update Deployment (New Releases)](#update-deployment)
10. [Monitoring & Maintenance](#monitoring)
11. [Troubleshooting](#troubleshooting)
12. [Complete Nginx Config Reference](#nginx-reference)
13. [Firewall Setup](#firewall)
14. [Automatic Deployments (Optional)](#auto-deploy)

---

## 1. What You Need Before Starting <a name="prerequisites"></a>

| Item                | Description                                        | Example                     |
| ------------------- | -------------------------------------------------- | --------------------------- |
| **VPS Provider**    | Any VPS with Ubuntu 22.04 or 24.04                 | DigitalOcean, Hetzner, Vultr|
| **Domain Name**     | Your domain pointed to the VPS IP                  | `seventrip.com.bd`          |
| **SSH Access**      | Ability to connect to your server                  | `ssh root@your-ip`          |
| **Min. Specs**      | 1 vCPU, 1 GB RAM, 25 GB disk (minimum)            |                             |
| **Git Repository**  | Your frontend code in a Git repo (GitHub, etc.)    |                             |

### DNS Setup (Do This First!)

Go to your domain registrar and add these DNS records:

| Type | Name              | Value           | TTL  |
| ---- | ----------------- | --------------- | ---- |
| A    | `@`               | `YOUR_VPS_IP`   | 3600 |
| A    | `www`             | `YOUR_VPS_IP`   | 3600 |
| A    | `api`             | `YOUR_VPS_IP`   | 3600 |

> Wait 5-30 minutes for DNS to propagate before proceeding.

---

## 2. Server Setup (Fresh Ubuntu VPS) <a name="server-setup"></a>

### Connect to your server

```bash
ssh root@YOUR_VPS_IP
```

### Update the system

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip software-properties-common
```

### Create a non-root user (recommended)

```bash
# Create user
adduser seventrip

# Give sudo access
usermod -aG sudo seventrip

# Switch to the new user
su - seventrip
```

---

## 3. Install Node.js <a name="install-nodejs"></a>

We use **nvm** (Node Version Manager) to install Node.js.

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload your shell
source ~/.bashrc

# Install Node.js 20 (LTS)
nvm install 20

# Verify installation
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

---

## 4. Clone and Build the Frontend <a name="clone-and-build"></a>

### Clone the repository

```bash
# Create a directory for your projects
mkdir -p ~/projects
cd ~/projects

# Clone your frontend repo
git clone https://github.com/your-username/seven-trip-frontend.git
cd seven-trip-frontend
```

### Install dependencies

```bash
npm install
```

### Create the environment file

```bash
cp .env.example .env
```

### Edit the environment file

```bash
nano .env
```

Set your production API URL:

```env
VITE_API_BASE_URL=https://api.seventrip.com.bd/api
```

Save: Press `Ctrl + X`, then `Y`, then `Enter`.

### Build for production

```bash
npm run build
```

This creates a `dist/` folder with your compiled website files:

```
dist/
├── index.html          ← Main HTML file
├── assets/
│   ├── index-abc123.js ← Compiled JavaScript
│   └── index-def456.css← Compiled CSS
├── images/
│   └── seven-trip-logo.png
├── favicon.ico
└── robots.txt
```

### Verify the build worked

```bash
ls -la dist/
# You should see index.html and an assets/ folder
```

---

## 5. Install and Configure Nginx <a name="install-nginx"></a>

Nginx is a web server that will serve your frontend files and proxy API requests.

### Install Nginx

```bash
sudo apt install -y nginx
```

### Start Nginx and enable on boot

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Test Nginx is running

Open your browser and go to `http://YOUR_VPS_IP`. You should see the "Welcome to nginx!" page.

### Create Nginx config for Seven Trip

```bash
sudo nano /etc/nginx/sites-available/seventrip
```

Paste this configuration:

```nginx
# Seven Trip Frontend
server {
    listen 80;
    server_name seventrip.com.bd www.seventrip.com.bd;

    # Where your built frontend files are
    root /home/seventrip/projects/seven-trip-frontend/dist;
    index index.html;

    # Serve static files directly
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # SPA fallback — all routes go to index.html
    # This is CRITICAL for React Router to work
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression for faster loading
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

# API Proxy (reverse proxy to your Node.js backend)
server {
    listen 80;
    server_name api.seventrip.com.bd;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Allow file uploads up to 50MB
        client_max_body_size 50m;
    }
}
```

### Enable the site

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/seventrip /etc/nginx/sites-enabled/

# Remove the default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test the configuration for errors
sudo nginx -t
```

You should see:
```
nginx: configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Reload Nginx

```bash
sudo systemctl reload nginx
```

### Test it!

Open `http://seventrip.com.bd` in your browser. You should see the Seven Trip website!

---

## 6. Set Up SSL (HTTPS) with Let's Encrypt <a name="setup-ssl"></a>

**Free SSL certificates** using Certbot + Let's Encrypt.

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL certificates

```bash
sudo certbot --nginx -d seventrip.com.bd -d www.seventrip.com.bd -d api.seventrip.com.bd
```

Certbot will ask:
1. **Email address** — Enter your email (for expiry notices)
2. **Agree to terms** — Type `Y`
3. **Share email** — Type `N` (optional)
4. **Redirect HTTP to HTTPS** — Choose `2` (Redirect)

### Verify auto-renewal

Certbot automatically renews certificates. Test it:

```bash
sudo certbot renew --dry-run
```

### Done!

Your site is now available at `https://seventrip.com.bd` with a valid SSL certificate! 🎉

---

## 7. Deploy the Backend API <a name="deploy-backend"></a>

Your Node.js backend runs separately. Here's the setup:

### Install PM2 (Process Manager)

PM2 keeps your Node.js app running 24/7 and restarts it if it crashes.

```bash
npm install -g pm2
```

### Clone and set up your backend

```bash
cd ~/projects
git clone https://github.com/your-username/seven-trip-api.git
cd seven-trip-api
npm install
```

### Create backend environment file

```bash
nano .env
```

```env
PORT=3001
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=seventrip
DATABASE_USER=seventrip_user
DATABASE_PASSWORD=YOUR_STRONG_PASSWORD
JWT_SECRET=YOUR_RANDOM_SECRET_STRING_64_CHARS
JWT_REFRESH_SECRET=ANOTHER_RANDOM_SECRET_STRING_64_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=https://seventrip.com.bd
```

### Start with PM2

```bash
pm2 start npm --name "seventrip-api" -- start

# Save the process list so it restarts on server reboot
pm2 save

# Set PM2 to start on boot
pm2 startup
# (Copy and run the command it outputs)
```

### Useful PM2 commands

```bash
pm2 status                # See all running processes
pm2 logs seventrip-api    # View logs
pm2 restart seventrip-api # Restart the API
pm2 stop seventrip-api    # Stop the API
pm2 monit                 # Real-time monitoring
```

---

## 8. Configure Environment Variables <a name="configure-env"></a>

### Frontend (.env)

| Variable             | Value for Production                    |
| -------------------- | --------------------------------------- |
| `VITE_API_BASE_URL`  | `https://api.seventrip.com.bd/api`      |

> **Important:** Frontend env vars are baked into the build. After changing `.env`, you must run `npm run build` again.

### Backend (.env)

| Variable               | Description                                 |
| ---------------------- | ------------------------------------------- |
| `PORT`                 | Port the API listens on (default: 3001)     |
| `NODE_ENV`             | `production`                                |
| `DATABASE_HOST`        | MySQL host (usually `localhost`)            |
| `DATABASE_PORT`        | MySQL port (default: 3306)                  |
| `DATABASE_NAME`        | Database name                               |
| `DATABASE_USER`        | Database username                           |
| `DATABASE_PASSWORD`    | Database password                           |
| `JWT_SECRET`           | Secret for signing access tokens            |
| `JWT_REFRESH_SECRET`   | Secret for signing refresh tokens           |
| `JWT_EXPIRES_IN`       | Access token expiry (e.g., `15m`)           |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token expiry (e.g., `7d`)          |
| `SMTP_HOST`            | Email server hostname                       |
| `SMTP_PORT`            | Email server port                           |
| `SMTP_USER`            | Email username                              |
| `SMTP_PASS`            | Email password                              |
| `FRONTEND_URL`         | Frontend URL (for CORS and email links)     |

---

## 9. Update Deployment (New Releases) <a name="update-deployment"></a>

When you push new code and want to deploy:

### Frontend update

```bash
cd ~/projects/seven-trip-frontend

# Pull latest code
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# That's it! Nginx serves files directly from dist/, no restart needed.
```

### Backend update

```bash
cd ~/projects/seven-trip-api

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Restart the API
pm2 restart seventrip-api
```

### One-liner deploy script

Create `~/deploy-frontend.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying Seven Trip Frontend..."
cd ~/projects/seven-trip-frontend
git pull origin main
npm install
npm run build
echo "✅ Frontend deployed successfully!"
```

Make it executable:

```bash
chmod +x ~/deploy-frontend.sh
```

Run anytime: `~/deploy-frontend.sh`

---

## 10. Monitoring & Maintenance <a name="monitoring"></a>

### Check if everything is running

```bash
# Nginx status
sudo systemctl status nginx

# PM2 processes
pm2 status

# MySQL status
sudo systemctl status mysql

# Disk usage
df -h

# Memory usage
free -m

# Check SSL certificate expiry
sudo certbot certificates
```

### View logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Backend API logs
pm2 logs seventrip-api

# System logs
sudo journalctl -u nginx --since "1 hour ago"
```

### Automatic updates (security patches)

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 11. Troubleshooting <a name="troubleshooting"></a>

### "502 Bad Gateway" error

**Cause:** Nginx can't reach your backend API.

```bash
# Check if API is running
pm2 status

# If stopped, restart it
pm2 restart seventrip-api

# Check API logs for errors
pm2 logs seventrip-api --lines 50
```

### "403 Forbidden" error

**Cause:** Nginx can't read the dist/ folder.

```bash
# Fix file permissions
sudo chown -R www-data:www-data ~/projects/seven-trip-frontend/dist/
# OR
sudo chmod -R 755 ~/projects/seven-trip-frontend/dist/
```

### Pages return 404 (except homepage)

**Cause:** Nginx isn't configured for SPA routing.

Make sure your Nginx config has this line:
```nginx
try_files $uri $uri/ /index.html;
```

### "Mixed Content" warnings in browser

**Cause:** Your `VITE_API_BASE_URL` uses `http://` but the site is on `https://`.

Fix: Set `VITE_API_BASE_URL=https://api.seventrip.com.bd/api` in `.env` and rebuild.

### SSL certificate not renewing

```bash
# Manually renew
sudo certbot renew

# Check the renewal timer
sudo systemctl status certbot.timer
```

### "Cannot connect to MySQL"

```bash
# Check MySQL is running
sudo systemctl status mysql

# If not running, start it
sudo systemctl start mysql

# Test connection
mysql -u seventrip_user -p seventrip
```

### Out of memory (Node.js crashes)

```bash
# Check memory usage
free -m

# Increase swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 12. Complete Nginx Config Reference <a name="nginx-reference"></a>

Full production Nginx config with SSL (after Certbot):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name seventrip.com.bd www.seventrip.com.bd;
    return 301 https://$server_name$request_uri;
}

# Main frontend
server {
    listen 443 ssl http2;
    server_name seventrip.com.bd www.seventrip.com.bd;

    ssl_certificate /etc/letsencrypt/live/seventrip.com.bd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seventrip.com.bd/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /home/seventrip/projects/seven-trip-frontend/dist;
    index index.html;

    # Static assets with long cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# API reverse proxy
server {
    listen 80;
    server_name api.seventrip.com.bd;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.seventrip.com.bd;

    ssl_certificate /etc/letsencrypt/live/seventrip.com.bd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seventrip.com.bd/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50m;
    }
}
```

---

## 13. Firewall Setup <a name="firewall"></a>

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH       # SSH (port 22)
sudo ufw allow 'Nginx Full'  # HTTP (80) + HTTPS (443)
sudo ufw enable

# Verify
sudo ufw status
```

**Do NOT expose port 3001** to the public. The API runs internally and Nginx proxies requests to it.

---

## 14. Automatic Deployments (Optional) <a name="auto-deploy"></a>

### Using GitHub Webhooks

1. Create a webhook endpoint on your server (or use a tool like [webhook](https://github.com/adnanh/webhook))
2. When you push to `main`, GitHub calls your webhook
3. The webhook runs your deploy script

### Simple cron-based check

```bash
crontab -e
```

Add (checks every 5 minutes):

```
*/5 * * * * cd /home/seventrip/projects/seven-trip-frontend && git fetch && [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ] && git pull origin main && npm install && npm run build >> /var/log/seven-trip-deploy.log 2>&1
```

### Using GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/projects/seven-trip-frontend
            git pull origin main
            npm install
            npm run build
            echo "✅ Deployed!"
```

Set up secrets in GitHub → Settings → Secrets:
- `VPS_HOST`: Your server IP
- `VPS_USER`: `seventrip`
- `VPS_SSH_KEY`: Your SSH private key

---

## Quick Reference Card

| Task                      | Command                                              |
| ------------------------- | ---------------------------------------------------- |
| Deploy frontend           | `~/deploy-frontend.sh`                               |
| Restart API               | `pm2 restart seventrip-api`                          |
| View API logs             | `pm2 logs seventrip-api`                             |
| Restart Nginx             | `sudo systemctl reload nginx`                        |
| Test Nginx config         | `sudo nginx -t`                                      |
| Renew SSL                 | `sudo certbot renew`                                 |
| Check disk space          | `df -h`                                              |
| Check memory              | `free -m`                                            |
| Build frontend            | `cd ~/projects/seven-trip-frontend && npm run build` |
| Check what's running      | `pm2 status && sudo systemctl status nginx`          |

---

**🎉 Your Seven Trip platform is now live on your Ubuntu VPS!**

If you run into issues, check the [Troubleshooting](#troubleshooting) section or open an issue in the repository.
