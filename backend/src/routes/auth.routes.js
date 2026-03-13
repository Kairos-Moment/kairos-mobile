// backend/src/routes/auth.routes.js

const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');

const JWT_SECRET = process.env.SESSION_SECRET || 'fallback_secret';

// --- 1. CONFIGURATION ---
const FRONTEND_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
const MOBILE_REDIRECT_URI = process.env.MOBILE_REDIRECT_URI || "mobile://--/login-success";

// --- 2. PROTECTED ROUTES ---
router.get("/login/success", ensureAuthenticated, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User is authenticated.",
    user: req.user
  });
});

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

router.get(
  "/github",
  (req, res, next) => {
    const isMobile = req.query.platform === 'mobile';
    req.session.isMobileAuth = isMobile;

    if (req.query.redirect_uri) {
      req.session.mobileRedirectHint = req.query.redirect_uri;
    }

    const strategy = isMobile ? "github-mobile" : "github";
    passport.authenticate(strategy, {
      scope: ["read:user"],
      state: isMobile ? 'mobile' : 'web'
    })(req, res, next);
  }
);

router.get(
  "/github/callback",
  (req, res, next) => {
    const isMobile = req.query.state === 'mobile' || req.session.isMobileAuth;
    const strategy = isMobile ? "github-mobile" : "github";

    // Determine fallback redirect
    const fallback = req.session.mobileRedirectHint || MOBILE_REDIRECT_URI;
    const failureRedirect = isMobile ? fallback : `${FRONTEND_URL}/login`;

    passport.authenticate(strategy, {
      failureRedirect,
      session: true
    })(req, res, next);
  },
  (req, res) => {
    const isMobile = req.query.state === 'mobile' || req.session.isMobileAuth;

    if (!req.user) {
      console.error("Critical Auth Error: No user object found after success.");
      const fallback = req.session.mobileRedirectHint || MOBILE_REDIRECT_URI;
      return res.redirect(isMobile ? fallback : `${FRONTEND_URL}/login`);
    }

    // Force session to save before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session Save Error:", err);
      }

      if (isMobile) {
        // --- JWT TOKEN FOR MOBILE BRIDGE ---
        // We sign a token that the mobile app can use to bypass cookie limitations
        const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: '30d' });

        const target = req.session.mobileRedirectHint || MOBILE_REDIRECT_URI || "mobile://--/login-success";
        const redirectUrl = target.includes('?')
          ? `${target}&success=true&token=${token}`
          : `${target}?success=true&token=${token}`;

        console.log(`[AUTH SUCCESS] Redirecting Mobile with Token: ${req.user.username}`);
        res.redirect(redirectUrl);
      } else {
        res.redirect(`${FRONTEND_URL}/`);
      }
    });
  }
);

module.exports = router;