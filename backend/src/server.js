// backend/src/server.js

// --- 1. CONFIGURATION ---
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '../.env') });

// Determine if we are in production or development
// In Render Dashboard, NODE_ENV is automatically set to 'production'
const isProduction = process.env.NODE_ENV === 'production';

// --- 2. IMPORTS ---
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/database');
const { GitHub } = require("./config/auth");

// --- 3. INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 5001;

// Check this in your terminal when the server starts
console.log("--- SERVER CONFIG ---");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Secure Cookies:", process.env.NODE_ENV === 'production');
console.log("---------------------");

// --- 4. MIDDLEWARE SETUP ---

// CORS Configuration
// We allow BOTH the Production URL and the Localhost URL
app.use(
  cors({
    origin: [
      "https://kairos-app.onrender.com", // Production Frontend
      "http://localhost:5173"            // Local Frontend (Vite default)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Proxy Configuration
// Only trust the proxy if we are actually behind one (Production)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Session Configuration
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'user_sessions',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,

      // --- DYNAMIC SECURITY SETTINGS ---
      // If Production (Render): true (HTTPS)
      // If Development (Local): false (HTTP)
      secure: isProduction,

      // If Production: 'none' (Allows Cross-Site)
      // If Development: 'lax' (Allows Localhost)
      sameSite: isProduction ? 'none' : 'lax',

      httpOnly: true
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(GitHub);

// Passport Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const results = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = results.rows[0];
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// --- 5. ROUTES ---

app.get("/", (req, res) => {
  res.status(200).send(`<h1 style="text-align: center;">Kairos API Running in ${isProduction ? 'Production' : 'Development'} Mode</h1>`);
});

const insightsRoutes = require("./routes/insights.routes");
const taskRoutes = require("./routes/tasks.routes");
const goalRoutes = require("./routes/goals.routes");
const habitRoutes = require("./routes/habits.routes");
const focusSessionRoutes = require("./routes/focus-sessions.routes");
const savedTracksRoutes = require('./routes/saved-tracks.routes'); // NEW
const habitLogRoutes = require("./routes/habit-logs.routes");
const authRoutes = require("./routes/auth.routes.js");

app.use("/api/health", require("./routes/health.routes"));
app.use("/api/insights", insightsRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/focus-sessions", focusSessionRoutes);
app.use("/api/saved-tracks", savedTracksRoutes); // NEW
app.use("/api/habit-logs", habitLogRoutes);
app.use("/api/auth", authRoutes);

// --- 6. SERVER LISTENER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
});