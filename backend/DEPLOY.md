# SmartPark - Free Deployment Guide (Google Cloud)

## Architecture
- **Frontend** → Firebase Hosting (free forever)
- **Backend**  → Google Cloud Run (free tier: 2M requests/month)
- **Database** → MongoDB Atlas (free tier: 512MB)

---

## STEP 1: MongoDB Atlas (Free Database)

1. Go to https://www.mongodb.com/cloud/atlas → Sign up
2. Create a **FREE Shared Cluster (M0)** → Choose **Google Cloud** as provider
3. Go to **Database Access** → Add user with password
4. Go to **Network Access** → Add `0.0.0.0/0` (allow all)
5. Go to **Database** → Click **Connect** → **Drivers** → Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smartparking
   ```

---

## STEP 2: Google Cloud Setup (One-Time)

1. Go to https://console.cloud.google.com
2. Create new project → name it `smartpark`
3. Enable billing (won't charge within free tier)
4. Open **Cloud Shell** (top-right terminal icon)
5. Enable required APIs:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

---

## STEP 3: Deploy Backend to Cloud Run

### Option A: Deploy from Cloud Shell (Recommended)

1. In Cloud Shell, clone your repo (push to GitHub first):
   ```bash
   git clone https://github.com/YOUR_USERNAME/SmartPark.git
   cd SmartPark/backend
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy smartpark-api \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/smartparking" \
     --set-env-vars "JWT_SECRET=your_strong_secret_here_min_32_chars" \
     --set-env-vars "NODE_ENV=production" \
     --set-env-vars "CLIENT_URL=https://smartpark-xxxxx.web.app" \
     --port 5000 \
     --memory 512Mi \
     --min-instances 0 \
     --max-instances 1
   ```

3. After deploy, you'll get a URL like:
   ```
   https://smartpark-api-xxxxx-uc.a.run.app
   ```
   **Save this URL** — you'll need it for the frontend.

### Option B: Deploy from Local Machine

1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Login and set project:
   ```bash
   gcloud auth login
   gcloud config set project smartpark
   ```
3. Run the same `gcloud run deploy` command above from your `backend/` folder

---

## STEP 4: Deploy Frontend to Firebase Hosting

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Login to Firebase
```bash
firebase login
```

### Initialize Firebase in your project root
```bash
cd c:\Users\hp\OneDrive\Desktop\SmartPark
firebase init hosting
```

When prompted:
- **Project**: Select your Google Cloud project (`smartpark`)
- **Public directory**: `frontend/dist`
- **Single-page app**: **Yes**
- **Overwrite index.html**: **No**

### Set Environment Variables and Build Frontend

1. Update `frontend/.env` for production:
   ```
   VITE_API_URL=https://smartpark-api-xxxxx-uc.a.run.app/api
   VITE_SOCKET_URL=https://smartpark-api-xxxxx-uc.a.run.app
   ```
   (Replace with your actual Cloud Run URL from Step 3)

2. Build the frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

### Deploy to Firebase
```bash
firebase deploy --only hosting
```

You'll get a URL like:
```
https://smartpark-xxxxx.web.app
```

---

## STEP 5: Update Backend with Frontend URL

Go back to Cloud Run and update the CLIENT_URL:

```bash
gcloud run services update smartpark-api \
  --region us-central1 \
  --set-env-vars "CLIENT_URL=https://smartpark-xxxxx.web.app"
```

---

## STEP 6: Update CORS (Already Handled)

The backend already reads `CLIENT_URL` from environment variables for CORS, so once you set it in Step 5, everything will work.

---

## Quick Deploy Commands Summary

```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "SmartPark initial commit"
git remote add origin https://github.com/YOUR_USERNAME/SmartPark.git
git push -u origin main

# 2. Deploy backend (from backend/ folder)
gcloud run deploy smartpark-api --source . --region us-central1 --allow-unauthenticated --port 5000 --memory 512Mi --min-instances 0 --max-instances 1

# 3. Build & deploy frontend
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## Free Tier Limits (Won't Be Charged If You Stay Under)

| Service | Free Limit |
|---------|-----------|
| Cloud Run | 2M requests/month, 360K GB-sec, 180K vCPU-sec |
| Firebase Hosting | 10 GB storage, 360 MB/day transfer |
| MongoDB Atlas M0 | 512 MB storage, shared RAM |

---

## Important Notes

- **Cloud Run cold starts**: With `min-instances 0`, the backend sleeps when idle and takes ~3-5 seconds to wake up. This is normal for free tier.
- **File uploads**: Cloud Run containers are ephemeral — uploaded parking lot images will be lost on restart. For persistent uploads, use Google Cloud Storage (also has free tier).
- **WebSocket on Cloud Run**: Cloud Run supports WebSockets, but connections timeout after ~15 min of inactivity. Socket.io will auto-reconnect.
- **Admin login**: admin@smartpark.com / admin123 (change this after first login!)
- **SMTP**: For email features (password reset), set SMTP env vars in Cloud Run too.
