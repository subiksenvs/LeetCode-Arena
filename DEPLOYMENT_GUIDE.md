# 🚀 Full Deployment Guide (GitHub Pages + Render + Firebase)

This guide walks you through deploying your **LeetCode Leaderboard Arena**:
1. **Database**: Firebase Firestore (Persistent cloud database)
2. **Backend Server**: Render.com (Free Express Node.js web service)
3. **Frontend**: GitHub Pages (Free static hosting with GitHub Actions)

---

## 1. Firebase Firestore Setup (Database)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project** (e.g. `leetcode-leaderboard`).
2. In the left sidebar, click **Build** ➔ **Firestore Database** ➔ **Create Database**.
   - Select your region (e.g. `asia-south1` or `us-central1`).
   - Start in **Production Mode** (or Test Mode).
3. Generate your Service Account Key:
   - Click the ⚙️ **Project Settings** (gear icon next to Project Overview) ➔ **Service accounts** tab.
   - Click **Generate new private key** ➔ **Generate key**.
   - A `.json` file will download to your computer.
   - Open this `.json` file in a text editor — you will use these credentials in Render (Step 2).

---

## 2. Render.com Setup (Backend Web Service)

1. Push your project to your GitHub repository.
2. Go to [Render.com](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Fill in the settings:
   - **Name**: `leetcode-leaderboard-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Advanced** ➔ **Add Environment Variable**:
   | Key | Value | Notes |
   |---|---|---|
   | `PORT` | `3000` | Port for Express |
   | `FIREBASE_PROJECT_ID` | `<your-project-id>` | From your Firebase `.json` |
   | `FIREBASE_CLIENT_EMAIL` | `<your-client-email>` | From your Firebase `.json` |
   | `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n..."` | From your Firebase `.json` (include quotes & full key) |
6. Click **Create Web Service**.
7. Once deployed, copy your Render backend URL (e.g. `https://leetcode-leaderboard-backend.onrender.com`).

---

## 3. GitHub Pages Setup (Frontend Hosting)

1. Go to your repository on **GitHub** ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions**.
2. Click **New repository secret**:
   - **Name**: `VITE_API_KEY`
   - **Secret**: `https://leetcode-leaderboard-backend.onrender.com` *(Paste your Render backend URL from Step 2)*
3. Enable GitHub Pages:
   - Go to **Settings** ➔ **Pages** (in the left sidebar).
   - Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
4. Push a commit or trigger the workflow:
   - Go to the **Actions** tab on GitHub ➔ **Deploy Frontend to GitHub Pages** ➔ click **Run workflow**.
5. Your leaderboard will be live at `https://<your-username>.github.io/<your-repo-name>/`!

---

## 4. Default Admin Login

- **Username**: `admin`
- **Password**: `admin@123`

The Admin account can view and manage all student records uploaded across all user accounts.
