# Kairos: Time Management 🕰️

**Kairos** (Ancient Greek: καιρός) represents the opportune moment. This app is designed to help you manage your time and move away from the "grind" and into a rhythmic, purposeful way of living. It transforms habit tracking into a digital garden and task management into a focused practice.

---

## ✨ Features

### 🌿 Garden of Habits
- **Long-Term Growth**: Traditional trackers are binary (did it/didn't it). Kairos supports **Target Counts** across different periods:
  - **Daily**: Your constant rhythms.
  - **Weekly**: Goals like "Exercise 3 times a week."
  - **Monthly**: Larger aspirations like "Read 2 books this month."
- **Progress Tracking**: Visual progress bars show you exactly how close you are to your goals.

### 🔮 The Oracle
- **Priority Filtering**: The Oracle analyzes your task list and highlights the most urgent priorities, filtering out the noise.
- **Dynamic Insights**: Get real-time feedback on your habits and productivity patterns.

### ⏲️ Focus Space
- **Immersion**: A dedicated session timer to help you enter a state of deep work.
- **Productivity Tracking**: Every minute spent in focus is automatically logged and visualized in your reports.

### 🎤 Voice Integration
- **Hands-Free Logging**: Use the integrated **Web Speech API** to log habits via voice commands. Just tell the Oracle "Log reading habit" and watch your garden grow.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), CSS Modules, `date-fns` for period logic.
- **Backend**: Node.js, Express, Passport.js (GitHub OAuth).
- **Database**: PostgreSQL (Persistence for users, habits, logs, and tasks).
- **Hosting**: Render (Web Service + Managed PostgreSQL).

---

## 🚀 Getting Started

### Local Development
1. **Clone the repo.**
2. **Environment Setup**: Create a `.env` file in the root with:
   ```env
   DATABASE_URL=your_postgres_url
   GITHUB_CLIENT_ID=your_id
   GITHUB_CLIENT_SECRET=your_secret
   GITHUB_CALLBACK_URL=http://localhost:5001/api/auth/github/callback
   CLIENT_URL=http://localhost:5173
   SESSION_SECRET=your_secret
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   npm run install-all  # (If using a root script) or cd backend && npm install, cd frontend && npm install
   ```
4. **Run**:
   ```bash
   npm run dev
   ```

---

## 🛠️ Troubleshooting

### 1. "Be careful! The redirect_uri is not associated..." (GitHub Login)
- **Cause**: The `GITHUB_CALLBACK_URL` in your `.env` doesn't match the one registered in your GitHub Developer Settings.
- **Fix**: Ensure your GitHub OAuth App's "Authorization callback URL" is exactly:
  `https://your-backend-service.onrender.com/api/auth/github/callback` (for production)
  or `http://localhost:5001/api/auth/github/callback` (for local).

### 2. Slow Initial Load (Render Cold Start)
- **Problem**: The app takes 30-60 seconds to open the first time.
- **Reason**: Render's **Free Tier** spins down the server after 15 minutes of inactivity. The delay is the server waking up. Once awake, performance will be snappy.

### 3. Habits or Tasks "Stuck"
- **Fix**: Check your database connection. If using the Render Free PostgreSQL tier, ensure you haven't hit the **100 connection limit**. Restarting the backend service usually clears stale connections.

### 4. Voice Commands Not Working
- **Fix**: Ensure you are using a supported browser (Chrome is recommended) and have granted microphone permissions to the site. Voice commands require an active internet connection for the Web Speech API.

---

## 🪴 Future Roadmap
- [ ] **Garden Evolution**: Visualizing progress through an actual growing digital garden.
- [ ] **React Native Mobile Version**: Taking the sanctuary on the go.
- [ ] **AI Oracle**: Deeper behavioral insights using modern LLM integrations.
