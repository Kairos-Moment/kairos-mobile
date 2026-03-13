// backend/src/config/reset.js

const path = require('path');

// This line is critical. It ensures that when this script is run, it finds
// the single .env file located at the root of your project.
require('dotenv').config({ path: path.join(process.cwd(), '../.env') });

// Import the shared database pool. This ensures the script uses the same
// configuration (including conditional SSL) as your main application.
const { pool } = require("./database.js");

/**
 * This script will completely reset the database. It is a DESTRUCTIVE action.
 *
 * It will:
 * 1. Perform a safety check to prevent accidental execution in a production environment
 *    unless explicitly told to do so via the `NODE_ENV` variable.
 * 2. Drop all existing tables in the correct order to avoid dependency errors.
 * 3. Create all application tables AND the required `user_sessions` table.
 * 4. Seed the database with initial sample data for a test user.
 */
const resetDatabase = async () => {
  // SAFETY CHECK: This script is destructive. By default, we refuse to run it if
  // NODE_ENV is set to 'production' via a simple `npm start`.
  // The `npm run reset` script is specifically configured with `cross-env` to
  // bypass this check intentionally for a one-time remote reset.
  if (process.env.NODE_ENV === 'production' && !process.env.npm_config_prefix) {
    console.error("❌ DANGER: REFUSING TO RUN reset.js IN A LIVE PRODUCTION ENVIRONMENT.");
    console.error("This script should only be run intentionally via the 'npm run reset' command.");
    return;
  }

  try {
    console.log("--- Starting Database Reset ---");
    const client = await pool.connect();
    console.log("✅ Database connection successful.");

    // --- STEP 1: DROP existing tables (in reverse order of creation) ---
    console.log("\n-> Dropping all existing tables...");
    await client.query(`
      DROP TABLE IF EXISTS "user_sessions";
      DROP TABLE IF EXISTS saved_tracks;
      DROP TABLE IF EXISTS focus_sessions;
      DROP TABLE IF EXISTS habit_logs;
      DROP TABLE IF EXISTS subtasks;
      DROP TABLE IF EXISTS tasks;
      DROP TABLE IF EXISTS habits;
      DROP TABLE IF EXISTS goals;
      DROP TABLE IF EXISTS users;
    `);
    console.log("✅ All tables dropped successfully.");

    // --- STEP 2: CREATE tables (in the correct order of dependency) ---
    console.log("\n-> Creating all tables...");
    await client.query(`
      -- Users Table (For GitHub OAuth)
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        githubid INTEGER UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        avatarurl TEXT,
        accesstoken TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Goals Table
      CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'in_progress',
        target_date TIMESTAMP WITH TIME ZONE
      );

      -- Habits Table
      CREATE TABLE habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        frequency INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true
      );

      -- Tasks Table
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        is_urgent BOOLEAN DEFAULT false,
        is_important BOOLEAN DEFAULT false,
        due_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'pending',
        completed_at TIMESTAMP WITH TIME ZONE
      );

      -- Subtasks Table
      CREATE TABLE subtasks (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT false
      );

      -- Habit Logs Table
      CREATE TABLE habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completion_date DATE NOT NULL,
        notes TEXT DEFAULT '',
        UNIQUE (habit_id, completion_date) -- Prevents logging the same habit twice on the same day
      );

      -- Focus Sessions Table
      CREATE TABLE focus_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        duration_minutes INTEGER NOT NULL,
        notes TEXT DEFAULT ''
      );

      -- ** NEW ** Table for connect-pg-simple to store session data
      CREATE TABLE "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
      ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      CREATE INDEX "IDX_user_sessions_expire" ON "user_sessions" ("expire");

      -- Saved Tracks Table (Personal Audio Library)
      CREATE TABLE saved_tracks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        youtube_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ All tables created successfully.");

    // --- STEP 3: SEED the database with sample data ---
    console.log("\n-> Seeding database with initial data...");
    await client.query(`
      -- Insert a sample user (will have id=1)
      INSERT INTO users (githubid, username, avatarurl, accesstoken) VALUES
      (12345, 'testuser', 'https://avatars.githubusercontent.com/u/12345?v=4', 'mock_github_access_token_string');

      -- Insert sample data that references user_id=1
      INSERT INTO goals (user_id, title, description) VALUES (1, 'Complete Capstone Project', 'Finish all features, documentation, and presentation for the capstone.');
      INSERT INTO tasks (user_id, goal_id, title, is_important, due_date) VALUES (1, 1, 'Write project documentation', true, NOW() + INTERVAL '2 days');
      INSERT INTO habits (user_id, title) VALUES (1, 'Read for 20 minutes');
    `);
    console.log("✅ Database seeded successfully.");

    // Release the client back to the pool
    client.release();
    console.log("\n--- Database Reset Complete ---");

  } catch (error) {
    console.error("\n❌ An error occurred during the database reset:", error);
  } finally {
    // End the pool connection so the script can exit gracefully
    await pool.end();
    console.log("\n-> Database connection pool closed.");
  }
};

// Execute the main function
resetDatabase();