// backend/src/config/migrate.js
// Run once: node src/config/migrate.js
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '../.env') });
const { pool } = require('./database');

const migrate = async () => {
  try {
    await pool.query(`
      ALTER TABLE saved_tracks
        ADD COLUMN IF NOT EXISTS file_path TEXT,
        ALTER COLUMN youtube_id DROP NOT NULL;
    `);
    console.log('✅ Migration complete: saved_tracks updated.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
};

migrate();
