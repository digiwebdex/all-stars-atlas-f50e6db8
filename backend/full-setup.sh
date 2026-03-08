#!/bin/bash
# =============================================
# Seven Trip - COMPLETE ONE-CLICK SETUP
# Run this ONE command on your VPS:
#   cd ~/projects/all-stars-atlas && bash backend/full-setup.sh
# =============================================

set -e
echo ""
echo "🚀 ============================================"
echo "   SEVEN TRIP - FULL PLATFORM SETUP"
echo "   This will set up EVERYTHING for you."
echo "============================================"
echo ""

# ====== STEP 1: Variables ======
VPS_IP="187.77.137.249"
PROJECT_DIR="$HOME/projects/all-stars-atlas"
BACKEND_DIR="$PROJECT_DIR/backend"
DB_USER="seventrip_user"
DB_PASS="YourStrongPassword123!"
DB_NAME="seventrip"

cd "$PROJECT_DIR"

# ====== STEP 2: Pull latest code ======
echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main || true
echo "✅ Code updated"
echo ""

# ====== STEP 3: Create MySQL database and user if not exists ======
echo "🗄️  Step 2: Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';" 2>/dev/null || true
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost'; FLUSH PRIVILEGES;" 2>/dev/null || true
echo "✅ Database ready"
echo ""

# ====== STEP 4: Run migration (create tables + seed data) ======
echo "📊 Step 3: Creating tables and seeding data..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKEND_DIR/database/migration.sql"
echo "✅ All 20 tables created and seeded"
echo ""

# ====== STEP 5: Install backend dependencies ======
echo "📦 Step 4: Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install
echo "✅ Backend dependencies installed"
echo ""

# ====== STEP 6: Fix passwords (hash with bcrypt) ======
echo "🔑 Step 5: Hashing passwords..."
node fix-passwords.js
echo ""

# ====== STEP 7: Create uploads directory ======
mkdir -p uploads

# ====== STEP 8: Install PM2 if needed ======
if ! command -v pm2 &> /dev/null; then
  echo "📦 Step 6: Installing PM2..."
  sudo env "PATH=$PATH" npm install -g pm2
fi

# ====== STEP 9: Start/restart backend with PM2 ======
echo "🚀 Step 7: Starting backend server..."
pm2 delete seventrip-api 2>/dev/null || true
pm2 start server.js --name seventrip-api
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "✅ Backend running on port 3001"
echo ""

# ====== STEP 10: Build frontend with correct API URL ======
echo "🏗️  Step 8: Building frontend..."
cd "$PROJECT_DIR"

# Create frontend .env with correct API URL
cat > .env << EOF
VITE_API_BASE_URL=http://$VPS_IP/api
EOF

npm install
npm run build
echo "✅ Frontend built"
echo ""

# ====== STEP 11: Copy frontend build to Nginx directory ======
echo "🌐 Step 9: Deploying frontend to Nginx..."
sudo rm -rf /var/www/seventrip
sudo mkdir -p /var/www/seventrip
sudo cp -r dist/* /var/www/seventrip/
sudo chown -R www-data:www-data /var/www/seventrip
echo "✅ Frontend deployed"
echo ""

# ====== STEP 12: Configure Nginx ======
echo "⚙️  Step 10: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/seventrip > /dev/null << 'NGINX'
server {
    listen 80;
    server_name 187.77.137.249;

    root /var/www/seventrip;
    index index.html;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Node.js backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static uploads
    location /uploads {
        alias /root/projects/all-stars-atlas/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX

# Enable site
sudo ln -sf /etc/nginx/sites-available/seventrip /etc/nginx/sites-enabled/seventrip
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
echo "✅ Nginx configured"
echo ""

# ====== STEP 13: Open firewall ======
echo "🔒 Step 11: Configuring firewall..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
sudo ufw allow 22/tcp 2>/dev/null || true
echo "✅ Firewall configured"
echo ""

# ====== STEP 14: Verify everything ======
echo ""
echo "🔍 Verifying setup..."
echo ""

# Check backend health
HEALTH=$(curl -s http://localhost:3001/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Backend API: RUNNING"
else
  echo "❌ Backend API: NOT RESPONDING"
fi

# Check Nginx
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200"; then
  echo "✅ Frontend: SERVING"
else
  echo "⚠️  Frontend: Check Nginx logs (sudo tail -f /var/log/nginx/error.log)"
fi

echo ""
echo "============================================"
echo "🎉 SETUP COMPLETE!"
echo "============================================"
echo ""
echo "🌐 Your website: http://$VPS_IP"
echo "🔧 API endpoint: http://$VPS_IP/api/health"
echo ""
echo "🔑 LOGIN CREDENTIALS:"
echo "   ┌─────────────────────────────────────────────┐"
echo "   │ Admin Login:  http://$VPS_IP/admin/login     │"
echo "   │ Email: admin@seventrip.com.bd                │"
echo "   │ Pass:  Admin@123456                          │"
echo "   ├─────────────────────────────────────────────┤"
echo "   │ User Login:   http://$VPS_IP/auth/login      │"
echo "   │ Email: rahim@gmail.com                       │"
echo "   │ Pass:  User@123456                           │"
echo "   └─────────────────────────────────────────────┘"
echo ""
echo "📋 USEFUL COMMANDS:"
echo "   pm2 status              - Check if backend is running"
echo "   pm2 logs seventrip-api  - View backend logs"
echo "   pm2 restart seventrip-api - Restart backend"
echo "   sudo tail -f /var/log/nginx/error.log - Nginx errors"
echo ""
