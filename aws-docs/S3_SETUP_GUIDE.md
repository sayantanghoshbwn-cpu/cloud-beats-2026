# CloudBeats – AWS S3 Setup & Configuration Guide

This guide walks you through the exact steps required to configure your Amazon S3 bucket, CORS rules, and AWS IAM permissions for CloudBeats.

---

## 1. Create the S3 Bucket

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/s3/).
2. Navigate to **Amazon S3** > **Buckets** > **Create bucket**.
3. **Bucket name**: `cloudbeats-music-storage` *(or a globally unique name like `cloudbeats-music-storage-<your-name>`)*.
4. **AWS Region**: Select your preferred region (e.g., `us-east-1` or `ap-south-1`).
5. **Object Ownership**: Select **ACLs disabled (recommended)**.
6. **Block Public Access settings for this bucket**:
   - Check **Block *all* public access**.
   - Keep all 4 sub-options checked:
     - [x] Block public access to buckets and objects granted through *new* access control lists (ACLs)
     - [x] Block public access to buckets and objects granted through *any* access control lists (ACLs)
     - [x] Block public access to buckets and objects granted through *new* public bucket or access point policies
     - [x] Block public and cross-account access to buckets and objects through *any* public bucket or access point policies
   - *(CloudBeats relies entirely on secure, time-limited presigned URLs. No public access is permitted!)*
7. **Bucket Versioning**: Optional (Disable or Enable based on backup needs).
8. **Default encryption**: Select **Server-side encryption with Amazon S3 managed keys (SSE-S3)**.
9. Click **Create bucket**.

---

## 2. Configure Bucket Folders (Optional, created on-the-fly)

CloudBeats uses the following logical object prefixes:
- `music/` for audio tracks (`.mp3`, `.wav`, `.m4a`, `.aac`)
- `covers/` for album and song cover artwork (`.jpg`, `.jpeg`, `.png`, `.webp`)

These prefixes are automatically handled by the CloudBeats backend upload controller.

---

## 3. Configure S3 CORS (Cross-Origin Resource Sharing)

Because audio playback and direct presigned browser uploads (`PUT`) originate from the React frontend running on `http://localhost:5173`, S3 requires CORS configuration.

1. Open your bucket `cloudbeats-music-storage` in the S3 console.
2. Click the **Permissions** tab.
3. Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
4. Paste the following JSON (also found in `aws-docs/s3-cors.json`):

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
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

5. Click **Save changes**.

> **Note on ExposeHeaders:**
> Exposing `ETag`, `Content-Range`, and `Accept-Ranges` allows HTML5 `<audio>` elements to stream audio and scrub/seek without downloading the complete file.

---

## 4. Create an IAM Policy & User for Local Development

To allow your Node.js backend to generate presigned upload/download URLs and delete objects:

### Step 4.1: Create IAM Policy
1. Go to **AWS IAM Console** > **Policies** > **Create policy**.
2. Select the **JSON** tab and paste the following policy (found in `aws-docs/iam-policy.json`):

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
*(Replace `cloudbeats-music-storage` with your actual bucket name if different)*.
3. Click **Next**, name the policy `CloudBeatsS3Policy`, and click **Create policy**.

### Step 4.2: Create IAM User
1. Go to **IAM Console** > **Users** > **Create user**.
2. User name: `cloudbeats-backend-user`.
3. Do NOT check "Provide user access to the AWS Management Console" (programmatic access only).
4. In permissions, choose **Attach policies directly**, search for `CloudBeatsS3Policy`, and select it.
5. Finish creating the user.
6. Click on the user > **Security credentials** tab > **Create access key**.
7. Select **Application running outside AWS** > **Create access key**.
8. Copy the **Access Key ID** and **Secret Access Key**.

---

## 5. Configure Backend `.env`

In `backend/.env`, set:

```env
AWS_REGION=us-east-1
AWS_S3_BUCKET=cloudbeats-music-storage
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
```

Never commit `backend/.env` to Git! (It is excluded via `.gitignore`).

