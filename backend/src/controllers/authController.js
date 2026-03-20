const bcrypt = require('bcryptjs');
const xss = require('xss');
const { query } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../config/logger');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const cleanName = xss(name.trim());
    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length) {
      return errorResponse(res, 'Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, name, email, role, is_active, created_at`,
      [cleanName, cleanEmail, hashedPassword]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    // Store refresh token
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    logger.info(`New user registered: ${cleanEmail}`);

    return successResponse(res, {
      user,
      accessToken,
      refreshToken,
    }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const result = await query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (!result.rows.length) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return errorResponse(res, 'Account has been deactivated', 403);
    }

    if (!user.password) {
      return errorResponse(res, 'This account uses Google sign-in. Please login with Google.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    const { password: _, ...safeUser } = user;

    logger.info(`User logged in: ${cleanEmail}`);

    return successResponse(res, {
      user: safeUser,
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const result = await query(
      'SELECT id, email, role, is_active, refresh_token FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows.length || result.rows[0].refresh_token !== token) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return errorResponse(res, 'Account deactivated', 403);
    }

    const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);

    return successResponse(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );
    return successResponse(res, result.rows[0], 'Profile fetched');
  } catch (err) {
    next(err);
  }
};

const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, googleCallback };
