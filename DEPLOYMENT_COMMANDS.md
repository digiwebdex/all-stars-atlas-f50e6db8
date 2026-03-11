# Seven Trip — Working Deployment Commands

> **Auto-updated** with every change. Copy-paste ready commands for your VPS.
> Last updated: 2026-03-11

---

## 🚀 Standard Deployment (Frontend + Backend)

Use this after any code change:

```bash
cd ~/projects/all-stars-atlas && git pull origin main && npm install && npm run build && sudo cp -r dist/* /var/www/seventrip/ && cd backend && npm install && pm2 restart seventrip-api
```

---

## 🔧 Nginx Config Update

Only needed when `backend/nginx-optimized.conf` changes:

```bash
cd ~/projects/all-stars-atlas && git pull origin main && sudo cp backend/nginx-optimized.conf /etc/nginx/sites-available/seventrip && sudo nginx -t && sudo systemctl reload nginx
```

---

## 📦 Frontend Only (No Backend Changes)

```bash
cd ~/projects/all-stars-atlas && git pull origin main && npm install && npm run build && sudo cp -r dist/* /var/www/seventrip/
```

---

## 🖥️ Backend Only (No Frontend Changes)

```bash
cd ~/projects/all-stars-atlas && git pull origin main && cd backend && npm install && pm2 restart seventrip-api
```

---

## 🗄️ Database Migration

When new migration files are added in `backend/database/`:

```bash
cd ~/projects/all-stars-atlas && git pull origin main && mysql -u root -p seventrip < backend/database/<migration-file>.sql
```

---

## 📊 Useful Monitoring Commands

```bash
pm2 status                # Check API status
pm2 logs seventrip-api    # View API logs
pm2 monit                 # Real-time monitoring
sudo nginx -t             # Test Nginx config
sudo systemctl status nginx  # Nginx status
```

---

## 🔑 SSL Certificate Renewal

```bash
sudo certbot renew --dry-run   # Test renewal
sudo certbot renew             # Force renewal
```

---

## ⚠️ Troubleshooting

### Nginx "gzip duplicate" error
The gzip directives are in `/etc/nginx/nginx.conf` — do NOT add them in site configs.

### API not responding
```bash
pm2 restart seventrip-api && pm2 logs seventrip-api --lines 50
```

### Build fails
```bash
cd ~/projects/all-stars-atlas && rm -rf node_modules && npm install && npm run build
```

---

## 📝 Change Log

| Date | Change | Deploy Command |
|------|--------|----------------|
| 2026-03-11 | Performance: instant video, image lazy loading, Nginx optimization | Standard Deployment |
| 2026-03-11 | Flight results: "Select" button, Non-Refundable label fix | Standard Deployment |
| 2026-03-11 | Header/logo size reduction, page padding fixes | Standard Deployment |
| 2026-03-11 | Nginx optimized config (HTTP/2, caching, rate limiting) | Nginx Config Update |
| 2026-03-11 | Fix cabin class (Business/First) not being sent to TTI GDS + case-insensitive cabin mapping for all providers | Standard Deployment |
| 2026-03-11 | Fix cabin class display in results/booking to show searched class (Business/First) instead of GDS Economy default; color-coded multi-traveller form with per-type borders (Adult=green, Child=blue, Infant=purple) | Frontend Only |
