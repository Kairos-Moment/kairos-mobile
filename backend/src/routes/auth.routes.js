// backend/src/routes/auth.routes.js

const express = require("express");
const passport = require("passport");
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');

// --- 1. DETERMINE REDIRECT URL ---
// This Logic handles both Dev and Prod automatically:
// Priority 1: CLIENT_URL (Best practice: explicit variable in your .env)
// Priority 2: CORS_ORIGIN (Fallback: usually points to your frontend)
// Priority 3: Hardcoded Localhost (Safety net)
const FRONTEND_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

// --- 2. PROTECTED ROUTES ---
// Only accessible if logged in

/**
 * @route GET /api/auth/login/success
 * @description Frontend calls this to check if the user is logged in.
 */
router.get("/login/success", ensureAuthenticated, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User is authenticated.",
    user: req.user
  });
});

/**
 * @route GET /api/auth/logout
 * @description Logs user out and clears session.
 */
router.get("/logout", ensureAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return next(err);

      res.clearCookie("connect.sid");
      res.status(200).json({ success: true, message: "Logged out successfully." });
    });
  });
});

// --- 3. PUBLIC ROUTES ---
// GitHub Authentication Entry Points

/**
 * @route GET /api/auth/github
 * @description Start the GitHub login process.
 */
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["read:user"],
  })
);

/**
 * @route GET /api/auth/github/callback
 * @description GitHub redirects here after user approves.
 */
router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", (err, user, info) => {
      if (err) {
        console.error("Passport Authenticate Error:", err);
        return res.status(500).send(`Authentication Error: ${err.message}`);
      }
      if (!user) {
        console.warn("Passport Authenticate - No User Found:", info);
        return res.redirect(`${FRONTEND_URL}/login`);
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("Passport LogIn Error:", err);
          return res.status(500).send(`Login Error: ${err.message}`);
        }

        console.log(`GitHub Login Success. User ID: ${user.id}`);

        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.redirect(`${FRONTEND_URL}/login`);
          }
          res.redirect(`${FRONTEND_URL}/`);
        });
      });
    })(req, res, next);
  }
);

module.exports = router;