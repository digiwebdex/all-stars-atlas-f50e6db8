# Seven Trip — Working Deployment Commands

> **Auto-updated** with every change. Copy-paste ready commands for your VPS.
> Last updated: 2026-03-12 (v3.7.0 — Reward points system, enhanced flight cards with baggage/seats/class info)

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
| 2026-03-12 | Reward points system (earn/redeem/coupons), flight card baggage/seats/class info row, points badge on cards | Standard + DB Migration |
| 2026-03-12 | Sabre SOAP session manager (EnhancedSeatMap + GetAncillaryOffers), 4-step booking flow with SSR + Seat Map, ancillaries priority chain, TDZ bug fix | Standard Deployment |
| 2026-03-11 | Performance: instant video, image lazy loading, Nginx optimization | Standard Deployment |
| 2026-03-11 | Flight results: "Select" button, Non-Refundable label fix | Standard Deployment |
| 2026-03-11 | Header/logo size reduction, page padding fixes | Standard Deployment |
| 2026-03-11 | Nginx optimized config (HTTP/2, caching, rate limiting) | Nginx Config Update |
| 2026-03-11 | Fix cabin class (Business/First) not being sent to TTI GDS + case-insensitive cabin mapping for all providers | Standard Deployment |
| 2026-03-11 | Fix cabin class display in results/booking to show searched class (Business/First) instead of GDS Economy default; color-coded multi-traveller form with per-type borders (Adult=green, Child=blue, Infant=purple) | Frontend Only |
| 2026-03-11 | Multi-city flight search: date validation (segment 2+ enforces min date from previous), parallel per-segment API search, grouped results with per-segment selection, sticky booking bar | Frontend Only |
| 2026-03-11 | Flight search audit: fix per-passenger field error keys, remove 12% tax fallback (zero-mock), multi-city booking page support (step 1/review/fare sidebar), max 9 pax + infants≤adults limits, passport expiry 6-month validation, Bangladesh phone regex, passport expiry required for international | Frontend Only |
| 2026-03-11 | Fix cabin class display: remove frontend override that faked searched cabin on all results; now shows real API cabin class (Zero-Mock enforcement) | Frontend Only |
| 2026-03-11 | Add cabin class mismatch alert: when searched class (Business/First) is unavailable on route, shows amber info banner explaining results are Economy fares from airline | Frontend Only |
| 2026-03-11 | Fix duplicate cabin mismatch banner: removed extra alert outside DataLoader, kept single instance per view (one-way/round-trip inside DataLoader, multi-city inside its block) | Frontend Only |
| 2026-03-11 | Document expiry validation: block expired documents on ALL flights, enforce 6-month passport rule for international with detailed error messaging | Frontend Only |
| 2026-03-11 | Document Scanner: country field now shows full name (Bangladesh not BD), added countryCode field (BGD), labels updated to Given/First Name and Surname/Last Name, 70+ country mappings | Full Stack |
| 2026-03-11 | Nationality dropdown: free-text replaced with 70+ nationality Select dropdown, default Bangladeshi | Frontend Only |
| 2026-03-11 | OCR Engine v5: MRZ name priority enforced (rejects NID address noise), nationality auto-derived from country code, phone extraction from NID, all booking form fields auto-populated from scan | Full Stack |
| 2026-03-11 | OCR Engine v6: ICAO 9303 check digit validation (passport number, DOB, expiry, composite), MRZ nationality extraction (TD3 pos 10-12), cross-validation engine (MRZ vs visual text with confidence scoring), verified fields shown with shield badges in scanner UI | Full Stack |
| 2026-03-11 | OCR Engine v7: QR/Barcode detection & cross-validation — parses pipe-delimited, semicolon-delimited, and inline-encoded QR payloads; cross-validates QR data against MRZ and visual text; QR confirmation upgrades field confidence to 'verified'; UI shows QR detection badge | Full Stack |
