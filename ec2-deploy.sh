#!/bin/bash
# ====================================================================
# CloudBeats - AWS EC2 Automated Deployment Script
# ====================================================================

set -e

echo "=========================================================="
echo "🚀 Starting CloudBeats Setup & Deployment on AWS EC2..."
echo "=========================================================="

# 0. Setup Swap space if RAM is <= 1GB (prevents t2.micro out-of-memory crash)
MEM_TOTAL=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "2000")
if [ "$MEM_TOTAL" -lt 1500 ] && [ ! -f /swapfile ]; then
    echo "⚠️ Small instance detected (${MEM_TOTAL}MB RAM). Configuring 2GB Swap space..."
    sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap enabled successfully."
fi

# 1. Detect Package Manager & Install Node.js 20, Git & Build tools
if command -v apt-get &> /dev/null; then
    echo "📦 Ubuntu/Debian system detected. Updating packages..."
    sudo apt-get update -y
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs git build-essential
    fi
elif command -v dnf &> /dev/null; then
    echo "📦 Amazon Linux 2023 detected..."
    sudo dnf update -y
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js 20 LTS..."
        sudo dnf install -y nodejs20 git
    fi
fi

# 2. Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ Installing PM2 process manager globally..."
    sudo npm install -g pm2
fi

# 3. Create backend/.env if not present
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env configuration..."
    cat << 'EOF' > backend/.env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://sayantanghoshbwn_db_user:z9LcU5iISKT9nEDz@cloudbeatscluster.sriaqn0.mongodb.net
JWT_SECRET=BJTY1q4CHpdW8tHKw5quWgoak95kby4DVhnFxoDYjbr
JWT_EXPIRE=30d
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=cloudbeats-music-storage
STRICT_S3_CHECK=false
ADMIN_EMAIL=admin@cloudbeats.io
EOF
    echo "✅ backend/.env created successfully!"
else
    echo "ℹ️ backend/.env already exists."
fi

# 4. Install backend dependencies
echo "📦 Installing Backend Dependencies..."
cd backend
npm install --production=false
cd ..

# 5. Build frontend if backend/public is missing
if [ ! -f backend/public/index.html ]; then
    echo "🔨 Building Frontend to backend/public..."
    cd frontend
    npm install
    npm run build
    cd ..
else
    echo "✅ Pre-built frontend ready in backend/public."
fi

# 6. Start or Restart process with PM2
echo "🚀 Managing process with PM2..."
if pm2 describe cloudbeats > /dev/null 2>&1; then
    echo "🔄 Reloading existing CloudBeats PM2 process..."
    pm2 reload cloudbeats --update-env
else
    echo "✨ Starting new CloudBeats process on port 5000..."
    pm2 start backend/server.js --name cloudbeats
fi

pm2 save

echo ""
echo "=========================================================="
echo "🎉 CloudBeats is LIVE on your AWS EC2 Instance!"
echo "👉 App URL: http://$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo '<EC2_PUBLIC_IP>'):5000"
echo "👉 Health Check: http://$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo '<EC2_PUBLIC_IP>'):5000/api/health"
echo "=========================================================="
