# 🚀 CloudBeats AWS EC2 Deployment Guide

This guide covers the complete step-by-step deployment of CloudBeats on an AWS EC2 instance.

---

## 📋 Overview of Architecture

```
Internet Users (Browser)
          │
          ▼
   AWS EC2 Instance (Ubuntu 22.04 LTS or Amazon Linux 2023)
   ┌─────────────────────────────────────────────────────────────┐
   │ Nginx (Port 80) ──> Express Backend (Port 5000)             │
   │                     ├── Serves React Static UI (public/)    │
   │                     ├── REST API (/api/*)                   │
   │                     └── AWS SDK v3 (EC2 IAM Role)           │
   └───────────────────────────────┬─────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
        AWS S3 Bucket                         MongoDB Atlas
 (cloudbeats-music-storage)             (Audio Metadata & Users)
```

---

## 🛠️ Step 1: AWS Console Setup

### 1.1 Create an IAM Role for EC2 (No Access Keys Needed!)
1. Go to **AWS Console** > **IAM** > **Roles** > **Create role**.
2. Select **AWS service** and choose **EC2**.
3. Under permissions policies, search for and attach:
   - `AmazonS3FullAccess` (or create a custom policy using `aws-docs/iam-policy.json`).
4. Role Name: `CloudBeats-EC2-S3-Role`.
5. Click **Create role**.

### 1.2 Launch EC2 Instance
1. Go to **AWS Console** > **EC2** > **Launch Instances**.
2. **Name**: `CloudBeats-Server`
3. **AMI**: Ubuntu Server 22.04 LTS (HVM) or Amazon Linux 2023.
4. **Instance Type**: `t2.micro` or `t3.small` (Free tier eligible).
5. **Key pair**: Create or select your `.pem` key pair (e.g. `cloudbeats-key.pem`).
6. **Network settings (Security Group)**:
   - Allow SSH (`22`) from `My IP` (or `0.0.0.0/0`)
   - Allow HTTP (`80`) from `0.0.0.0/0`
   - Allow Custom TCP (`5000`) from `0.0.0.0/0`
7. **Advanced Details**:
   - In **IAM instance profile**, select **`CloudBeats-EC2-S3-Role`**.
8. Click **Launch instance**.

### 1.3 Update MongoDB Atlas IP Whitelist
1. Log in to **MongoDB Atlas**.
2. Go to **Network Access** > **Add IP Address**.
3. Enter your EC2 instance's **Public IPv4 Address** (or `0.0.0.0/0` - Allow access from anywhere).
4. Click **Confirm**.

---

## 💻 Step 2: Push Your Local Code to GitHub

From your local machine terminal:

```bash
git init
git add .
git commit -m "feat: complete AWS S3 integration and EC2 production setup"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

*(Note: `.env` is ignored by `.gitignore` so your database password is not pushed).*

---

## 🖥️ Step 3: EC2 Terminal Deployment (Copy & Paste Commands)

### 3.1 Connect to EC2
```bash
ssh -i "your-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### 3.2 Automated One-Click Deployment (Method A - Recommended)
```bash
# Clone your repository
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
cd <YOUR_REPO_NAME>

# Make script executable and run
chmod +x ec2-deploy.sh
./ec2-deploy.sh
```

---

### 3.3 Manual Step-by-Step Deployment (Method B)

If you prefer running commands manually:

```bash
# 1. Update system & install Node.js 20 & Git
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2

# 2. Clone your project
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
cd <YOUR_REPO_NAME>

# 3. Create backend/.env
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

# 4. Install backend dependencies
cd backend
npm install
cd ..

# 5. Build frontend (if not pre-built in public/)
# Optional on t2.micro since public/ is already bundled:
# npm run build

# 6. Start with PM2
pm2 start backend/server.js --name cloudbeats
pm2 save
pm2 startup
```

---

## 🌐 Step 4 (Optional): Setup Nginx for Clean Port 80 Access

If you want users to access the app via `http://<EC2-PUBLIC-IP>` directly without `:5000`:

```bash
# 1. Install Nginx
sudo apt install -y nginx

# 2. Copy the reverse proxy config
sudo cp aws-docs/nginx-cloudbeats.conf /etc/nginx/sites-available/cloudbeats
sudo ln -s /etc/nginx/sites-available/cloudbeats /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 3. Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔍 Useful PM2 Commands

- View live server logs:
  ```bash
  pm2 logs cloudbeats
  ```
- Check server status:
  ```bash
  pm2 status
  ```
- Restart server:
  ```bash
  pm2 restart cloudbeats
  ```
- Stop server:
  ```bash
  pm2 stop cloudbeats
  ```

