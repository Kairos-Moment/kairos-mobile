// backend/src/routes/auth.routes.js

const express = require("express");
const passport = require("passport");
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');
const axios = require('axios');

const FRONTEND_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

// --- PROTECTED ROUTES ---

router.get("/login/success", (req, res) => {
  // Support both session-based (web) and token-based (mobile) auth
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.status(200).json({ success: true, message: "User is authenticated.", user: req.user });
  }

  // Token-based: look up user by their GitHub access token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    pool.query('SELECT * FROM users WHERE accesstoken = $1', [token])
      .then(result => {
        if (result.rows.length > 0) {
          return res.status(200).json({ success: true, message: "User is authenticated.", user: result.rows[0] });
        }
        return res.status(401).json({ success: false, message: "Invalid token." });
      })
      .catch(() => res.status(500).json({ success: false, message: "Server error." }));
    return;
  }

  return res.status(401).json({ success: false, message: "Not authenticated." });
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

// --- WEB GITHUB AUTH ---

router.get("/github", passport.authenticate("github", { scope: ["read:user"] }));

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

// Token exchange endpoint — mobile sends the code, backend returns the access token
router.post("/github/mobile/token", async (req, res) => {
  const { code, redirect_uri } = req.body;

  if (!code) return res.status(400).json({ error: 'No code provided' });

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID_MOBILE,
        client_secret: process.env.GITHUB_CLIENT_SECRET_MOBILE,
        code,
        redirect_uri,
      },
      { headers: { Accept: 'application/json' }, timeout: 10000 }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      console.error('[MOBILE TOKEN] GitHub error:', JSON.stringify(tokenRes.data));
      return res.status(400).json({ error: 'Failed to obtain access token', detail: tokenRes.data });
    }

    const profileRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: githubId, login: username, avatar_url: avatarUrl } = profileRes.data;

    const existing = await pool.query('SELECT * FROM users WHERE githubid = $1', [githubId]);
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE users SET username=$1, avatarurl=$2, accesstoken=$3 WHERE githubid=$4',
        [username, avatarUrl, accessToken, githubId]
      );
    } else {
      await pool.query(
        'INSERT INTO users (githubid, username, avatarurl, accesstoken) VALUES ($1,$2,$3,$4)',
        [githubId, username, avatarUrl, accessToken]
      );
    }

    console.log(`[MOBILE TOKEN] Success for user: ${username}`);
    res.json({ token: accessToken });
  } catch (err) {
    console.error('[MOBILE TOKEN] Error:', err.message);
    res.status(500).json({ error: 'Server error during token exchange' });
  }
});


// Uses a separate GitHub OAuth app with the mobile deep link as callback.

router.get("/github/mobile", (req, res) => {
  const { redirect_uri } = req.query;
  const mobileRedirectUri = redirect_uri || process.env.MOBILE_REDIRECT_URI;

  // Encode the mobile redirect URI in the state param so it survives the OAuth round-trip
  const state = Buffer.from(JSON.stringify({ mobileRedirectUri })).toString('base64');

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID_MOBILE,
    scope: 'read:user',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get("/github/mobile/callback", async (req, res) => {
  const { code, state } = req.query;

  // Recover the mobile redirect URI from state
  let mobileRedirectUri = process.env.MOBILE_REDIRECT_URI;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    if (decoded.mobileRedirectUri) mobileRedirectUri = decoded.mobileRedirectUri;
  } catch (e) {
    console.warn('[MOBILE AUTH] Could not parse state param, using default redirect URI');
  }

  if (!code) {
    return res.redirect(`${mobileRedirectUri}?error=no_code`);
  }

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID_MOBILE,
        client_secret: process.env.GITHUB_CLIENT_SECRET_MOBILE,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      console.error('[MOBILE AUTH] No access token returned:', JSON.stringify(tokenRes.data));
      return res.redirect(`${mobileRedirectUri}?error=no_token&detail=${encodeURIComponent(JSON.stringify(tokenRes.data))}`);
    }

    // Fetch GitHub user profile
    const profileRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: githubId, login: username, avatar_url: avatarUrl } = profileRes.data;

    // Upsert user in DB
    const existing = await pool.query('SELECT * FROM users WHERE githubid = $1', [githubId]);
    let user;

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        'UPDATE users SET username=$1, avatarurl=$2, accesstoken=$3 WHERE githubid=$4 RETURNING *',
        [username, avatarUrl, accessToken, githubId]
      );
      user = updated.rows[0];
    } else {
      const created = await pool.query(
        'INSERT INTO users (githubid, username, avatarurl, accesstoken) VALUES ($1,$2,$3,$4) RETURNING *',
        [githubId, username, avatarUrl, accessToken]
      );
      user = created.rows[0];
    }

    // Mobile uses token-based auth, no session needed — redirect straight back to the app
    console.log(`[MOBILE AUTH] Success for user: ${username}`);
    res.redirect(`${mobileRedirectUri}?token=${accessToken}&success=true`);

  } catch (err) {
    console.error('[MOBILE AUTH] Error:', err.message);
    res.redirect(`${mobileRedirectUri}?error=server_error`);
  }
});

module.exports = router;
