// backend/src/config/auth.js

require("passport-github2");
const { Strategy: GitHubStrategy } = require("passport-github2");
const { pool } = require("./database.js");

// The options object tells Passport how to communicate with GitHub.
// It correctly uses environment variables for security.
const options = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
};

/**
 * The `verify` function is the core of the Passport strategy.
 * It's called after GitHub successfully authenticates a user. Its job is to
 * find that user in our database or create a new one.
 *
 * This is a "find or create" or "upsert" logic.
 */
const verify = async (accessToken, refreshToken, profile, callback) => {
  // 1. Extract the necessary, clean data from the GitHub profile.
  const { id: githubId, username, photos } = profile;
  // Use a fallback for the avatar URL in case it's not provided.
  const avatarUrl = photos && photos.length > 0 ? photos[0].value : null;

  try {
    // 2. Check if the user already exists in our database using their unique GitHub ID.
    // This is more reliable than using the username, which can change.
    const findUserQuery = "SELECT * FROM users WHERE githubid = $1";
    const results = await pool.query(findUserQuery, [githubId]);

    const user = results.rows[0];

    // 3. If the user already exists, update their details and return them.
    if (user) {
      console.log(`User found: ${user.username}`);
      // UPDATE logic: If their avatar or access token has changed, update it.
      const updateUserQuery = `
        UPDATE users
        SET username = $1, avatarurl = $2, accesstoken = $3
        WHERE githubid = $4
        RETURNING *;
      `;
      const updatedResults = await pool.query(updateUserQuery, [
        username,
        avatarUrl,
        accessToken,
        githubId,
      ]);
      const updatedUser = updatedResults.rows[0];
      // The `callback` function tells Passport the authentication was successful.
      // The first argument is for an error (null here), the second is the user object.
      return callback(null, updatedUser);
    }

    // 4. If the user does NOT exist, create a new user record.
    console.log(`New user detected: ${username}. Creating new record...`);
    // The `created_at` column is handled by the database's DEFAULT, so we don't provide it.
    const createUserQuery = `
      INSERT INTO users (githubid, username, avatarurl, accesstoken)
      VALUES ($1, $2, $3, $4)
      RETURNING *; -- This returns the full user object, including the new 'id'.
    `;
    const newResults = await pool.query(createUserQuery, [
      githubId,
      username,
      avatarUrl,
      accessToken,
    ]);
    const newUser = newResults.rows[0];

    console.log(`New user created with id: ${newUser.id}`);
    // Signal to Passport that the new user was created successfully.
    return callback(null, newUser);

  } catch (error) {
    // If any database error occurs, signal a failure to Passport.
    console.error("Error in Passport verify function:", error);
    return callback(error);
  }
};

// Create a new instance of the GitHubStrategy with our options and verify function.
const GitHub = new GitHubStrategy(options, verify);

// Export the configured strategy so it can be used in server.js.
module.exports = { GitHub };