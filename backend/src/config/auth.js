// backend/src/config/auth.js

require("passport-github2");
const { Strategy: GitHubStrategy } = require("passport-github2");
const { pool } = require("./database.js");

const webOptions = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
};

// Mobile Fallback: Use web keys if mobile ones are not defined to prevent initialization crash
const mobileOptions = {
  clientID: process.env.GITHUB_CLIENT_ID_MOBILE || process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET_MOBILE || process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
};

if (!process.env.GITHUB_CLIENT_ID_MOBILE) {
  console.warn("WARNING: GITHUB_CLIENT_ID_MOBILE is not set. Falling back to default GitHub keys.");
}

/**
 * The `verify` function is the core of the Passport strategy.
 * It's called after GitHub successfully authenticates a user. Its job is to
 * find that user in our database or create a new one.
 */
const verify = async (accessToken, refreshToken, profile, callback) => {
  const { id: githubId, username, photos } = profile;
  const avatarUrl = photos && photos.length > 0 ? photos[0].value : null;

  try {
    const findUserQuery = "SELECT * FROM users WHERE githubid = $1";
    const results = await pool.query(findUserQuery, [githubId]);
    const user = results.rows[0];

    if (user) {
      console.log(`User Logged In (Existing): ${user.username}`);
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
      return callback(null, updatedResults.rows[0]);
    }

    console.log(`User Logged In (New): ${username}`);
    const createUserQuery = `
      INSERT INTO users (githubid, username, avatarurl, accesstoken)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const newResults = await pool.query(createUserQuery, [
      githubId,
      username,
      avatarUrl,
      accessToken,
    ]);
    return callback(null, newResults.rows[0]);

  } catch (error) {
    console.error("Error in Passport verify function:", error);
    return callback(error);
  }
};

// Create named strategies
const GitHubWeb = new GitHubStrategy(webOptions, verify);
const GitHubMobile = new GitHubStrategy(mobileOptions, verify);

GitHubWeb.name = 'github';
GitHubMobile.name = 'github-mobile';

module.exports = {
  GitHub: GitHubWeb,
  GitHubMobile: GitHubMobile
};