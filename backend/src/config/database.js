// backend/src/config/database.js

const path = require('path');
const pg = require("pg"); 

// Load the .env from the root
require('dotenv').config({ path: path.join(process.cwd(), '../.env') });

const config = {
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE
};

// --- SSL CONFIGURATION ---
// Render databases REQUIRE SSL connections from outside (your local computer).
// 1. If we are in Production (running on Render), we need SSL.
// 2. If we are Local but connecting to a Render Host, we ALSO need SSL.
if (process.env.NODE_ENV === 'production' || (config.host && config.host.includes('render.com'))) {
  config.ssl = {
    rejectUnauthorized: false, // Required for Render's self-signed certs
  };
}

const pool = new pg.Pool(config);

module.exports = { pool };