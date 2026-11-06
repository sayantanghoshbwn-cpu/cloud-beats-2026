# CloudBeats – AWS S3 Music Streaming Platform

CloudBeats is a high-performance cloud-native music streaming platform built with **React.js (Vite + Tailwind CSS)**, **Node.js / Express.js**, and **MongoDB**, featuring end-to-end integration with **Amazon Web Services (AWS) S3** using the **AWS SDK for JavaScript v3**.

The application uses an **Obsidian Green + Purple** dark cyberpunk theme with responsive controls, real-time audio scrubbing via HTTP Range requests, and secure presigned URL workflows.

---

## 🏗️ Architecture Overview

```
                      +---------------------------------------+
                      |         React.js Frontend UI          |
                      |  (Obsidian Green + Purple Dark Theme) |
                      +-------------------+-------------------+
                                          |
                        1. Request        |  3. Direct PUT Upload
                        Presigned URL     |  & Range GET Stream
                                          v
                      +-------------------+-------------------+
                      |                                       |
                      v                                       v
         +--------------------------+           +--------------------------+
         |     Express.js API       |           |     Amazon S3 Bucket     |
         |  (AWS SDK v3 + MongoDB)  |           | (Private / No Public ACL)|
         +-------------+------------+           +--------------------------+
                       |                                      |
                       | 2. Generate Presigned URL            |
                       +--------------------------------------+
                       |
                       v
         +--------------------------+
         |    MongoDB Database      |
         |   (Metadata & S3 Keys)   |
         +--------------------------+
```

### Key Architectural Tenets:
1. **Direct Browser-to-S3 Uploads (Presigned PUT):**
   Large audio tracks (`.mp3`, `.wav`, `.m4a`, `.aac`) and cover images never transit through or tie up Node.js server memory. The client uploads directly to AWS S3 using time-limited presigned PUT URLs (5-minute expiration).
2. **Secure Presigned GET Streaming with HTTP 206 Range Scrubbing:**
   The S3 bucket is **100% private** with S3 Block Public Access completely enabled. Audio streaming and cover image retrieval use presigned GET URLs generated on-demand and cached within their validity window.
3. **Persistent S3 Keys, Ephemeral URLs:**
   Only permanent S3 object keys (e.g., `music/uuid-track.mp3` and `covers/uuid-cover.jpg`) are saved in MongoDB. Presigned URLs are generated on-demand to guarantee freshness and prevent expired URL staleness.
4. **Atomic Object Cleanup:**
   Deleting a song through the Admin Manage Songs interface removes both the audio and cover objects from S3 via `DeleteObjectCommand`, followed by removing the document from MongoDB.

---

## 🪣 AWS S3 Bucket Structure

```
cloudbeats-music-storage/
│
├── music/
│   ├── 8f4e2...-cyberpulse-midnight.mp3
│   ├── a12c9...-emerald-mirage.wav
│   └── 39f0d...-purple-velvet.m4a
│
└── covers/
    ├── e84a1...-cyberpulse-cover.jpg
    ├── 71bf0...-emerald-cover.png
    └── d45c3...-purple-cover.webp
```

---

## ⚙️ S3 Bucket & Security Configuration

### 1. S3 CORS Configuration (`aws-docs/s3-cors.json`)
Apply this CORS configuration to your S3 bucket under **Permissions > Cross-origin resource sharing (CORS)**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Range",
      "Accept-Ranges",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 2. IAM Policy for CloudBeats Backend (`aws-docs/iam-policy.json`)
Attach this least-privilege policy to your backend's IAM User or EC2/ECS Execution Role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudBeatsS3ObjectActions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::cloudbeats-music-storage/*"
    },
    {
      "Sid": "CloudBeatsS3BucketActions",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::cloudbeats-music-storage"
    }
  ]
}
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Node.js:** v18+ (tested on Node v24)
- **MongoDB:** Local MongoDB or MongoDB Atlas URI
- **AWS Account:** With an S3 Bucket created and IAM credentials

---

### Step 1: Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment variables
# Copy .env.example to .env
cp .env.example .env

# Edit .env and supply your credentials:
# PORT=5000
# MONGODB_URI=mongodb://127.0.0.1:27017/cloudbeats
# JWT_SECRET=your_jwt_secret_key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=cloudbeats-music-storage
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key

# 3. Seed initial admin and test accounts (Optional)
npm run seed

# 4. Start backend server
npm run dev
# Server will run on http://localhost:5000
```

---

### Step 2: Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
# In frontend/.env:
# VITE_API_URL=/api

# 3. Start Vite development server
npm run dev
# Frontend will run on http://localhost:5173
```

---

## 🔐 Default Demo Accounts

If you run `npm run seed` in the `backend/` directory, these demo accounts are created:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@cloudbeats.io` | `adminpassword123` | Full Access: S3 Direct Upload, Edit Metadata, Delete S3 Tracks |
| **Listener** | `user@cloudbeats.io` | `userpassword123` | Stream Music, Search, Create & Manage Playlists |

*(Both accounts can be quickly auto-filled on the `/login` page with one click!)*

---

## 🧪 Testing Checklist (12 Verification Steps)

- [x] **Test 1: Admin uploads an MP3 file**
  - Navigate to `/admin/upload`, choose an MP3/WAV/M4A file, fill metadata, click Upload.
- [x] **Test 2: Verify file exists in S3 `music/` prefix**
  - Audio key format: `music/<uuid>-<filename>.mp3`. S3 PUT request succeeds with 200 OK.
- [x] **Test 3: Upload cover image**
  - Select JPG/PNG/WEBP artwork in the upload form.
- [x] **Test 4: Verify cover exists in S3 `covers/` prefix**
  - Cover key format: `covers/<uuid>-<filename>.jpg`.
- [x] **Test 5: Verify metadata saved in MongoDB**
  - Check Song collection; `audioKey` and `coverKey` are stored (never permanent URLs).
- [x] **Test 6: Login as normal user**
  - Sign in with `user@cloudbeats.io` or register a new user.
- [x] **Test 7: Search for an uploaded song**
  - Use the global search bar or navigate to `/search` to query by title, artist, or genre.
- [x] **Test 8: Play song via Presigned GET URL**
  - Click Play on any track. The player requests `/api/songs/:id/stream` and streams audio.
- [x] **Test 9: Controls & Scrubbing (HTTP Range Request)**
  - Test Play/Pause, Next/Previous, Volume, and scrubbing along the seek bar. Range requests fetch byte ranges smoothly.
- [x] **Test 10: Private S3 bucket verification**
  - Attempting to access `https://cloudbeats-music-storage.s3.amazonaws.com/music/...` directly in browser returns `403 Forbidden AccessDenied`.
- [x] **Test 11: Expired presigned URL verification**
  - Upload URLs expire after 300 seconds; attempting a PUT after expiration is rejected with `AccessDenied`.
- [x] **Test 12: Admin deletes song**
  - Navigate to `/admin/manage`, click Delete. Backend invokes `DeleteObjectCommand` on both S3 keys and deletes the MongoDB document.

---

## 🚀 AWS EC2 Production Deployment

The frontend is built and served directly by the Express.js server from `backend/public/`. This means you can run the entire platform on a single EC2 instance on Port 5000 (or Port 80 via Nginx reverse proxy).

### Quick Deployment on Ubuntu EC2:

1. **Attach IAM Role:**
   Attach an IAM Role with `AmazonS3FullAccess` to your EC2 instance (no AWS access keys needed in `.env`!).

2. **MongoDB Atlas IP Access:**
   Add your EC2 Public IP to the MongoDB Atlas Network Access IP Whitelist.

3. **Deploy from EC2 Terminal:**
   ```bash
   # Clone repository
   git clone <YOUR_GITHUB_REPO_URL>
   cd "AWS internship project"

   # Run automated setup script
   chmod +x ec2-deploy.sh
   ./ec2-deploy.sh
   ```

4. **Access Application:**
   Open `http://<EC2-PUBLIC-IP>:5000` in your browser.

For complete manual setup instructions and Nginx configuration, see [`aws-docs/EC2_DEPLOYMENT_GUIDE.md`](aws-docs/EC2_DEPLOYMENT_GUIDE.md).


