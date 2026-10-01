# ⚡ LeetCode Arena — Realtime Leaderboard & Analytics

A futuristic, full-stack real-time competitive programming leaderboard and analytics dashboard for tracking LeetCode performance, problem-solving streaks, and department-level statistics.

Developed & Architected by **[Subiksen V S](https://github.com/subiksenvs)**.

---

## 🌟 Key Features

- **⚡ Live LeetCode Sync**: Fetches real-time statistics (total solved, difficulty breakdown, acceptance rates, global ranking, badges, and streaks) directly from LeetCode.
- **🏆 Multi-View Leaderboard**:
  - **Table View**: Compact, sortable view with department filtering and search.
  - **Cards View**: Grid view showcasing podium badges and streak progress.
  - **Department Analytics**: Department-level breakdown with total problems solved and average acceptance stats.
- **🥇 Champions Podium**: Highlight top 3 problem solvers with gold, silver, and bronze podium cards.
- **📊 Excel / CSV Ingestion & Export**:
  - Batch upload student lists via `.xlsx` or `.csv` (Name, Register No, Department, Username).
  - One-click export of the complete leaderboard data with full statistics into formatted Excel spreadsheets.
- **🔐 Role-Based Access Control**:
  - **Admin Control Panel**: View, manage, and synchronize records across all accounts.
  - **User Accounts**: Manage individual batches and track dedicated student lists.
- **🔥 Firebase Firestore Cloud Persistence**: Real-time cloud storage powered by Firebase Firestore.
- **🎨 Cyberpunk Dark Aesthetic**: Glassmorphism, neon accents, and smooth animations.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, SheetJS
- **Backend**: Node.js, Express, Firebase Admin SDK, node-fetch
- **Database**: Firebase Cloud Firestore
- **Hosting**:
  - Frontend: GitHub Pages (Automated with GitHub Actions)
  - Backend: Render Web Service

---

## 🚀 Quick Start (Local Setup)

### 1. Clone Repository
```sh
git clone https://github.com/subiksenvs/LeetCode-Arena.git
cd LeetCode-Arena
```

### 2. Backend Setup
```sh
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:3000`.*

### 3. Frontend Setup
```sh
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## ☁️ Deployment Guide

For complete instructions on deploying the frontend to **GitHub Pages**, backend to **Render**, and database to **Firebase Firestore**, refer to [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## 👤 Author & Copyright

- **Lead Developer**: **Subiksen V S** ([@subiksenvs](https://github.com/subiksenvs))
- **Copyright**: © 2026 Subiksen V S. All Rights Reserved.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
