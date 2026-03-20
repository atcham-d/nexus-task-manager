const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { query } = require('./database');
const logger = require('./logger');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('WARNING: Google OAuth credentials not set. /auth/google will not work.');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        // Find user by email
        const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        let user = result.rows[0];

        if (user) {
          // If user exists but has no google_id, link it
          if (!user.google_id) {
            await query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
            user.google_id = googleId;
            logger.info(`Linked Google ID for user: ${email}`);
          }

          if (!user.is_active) {
            return done(new Error('Account is inactive'), null);
          }
        } else {
          // Create new user
          const insertResult = await query(
            'INSERT INTO users (name, email, google_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email.toLowerCase(), googleId, 'user']
          );
          user = insertResult.rows[0];
          logger.info(`Created new user via Google OAuth: ${email}`);
        }

        return done(null, user);
      } catch (err) {
        logger.error('Error in Google Strategy:', err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
