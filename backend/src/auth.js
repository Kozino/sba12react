'use strict';
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'sba12-dev-secret-change-me';
const TOKEN_KEY = 'sba_admin_token';

function signToken(admin) {
  return jwt.sign(
    { id: admin.id, username: admin.username },
    SECRET,
    { expiresIn: '12h' }
  );
}

/** Express middleware: requires a valid admin JWT (Authorization: Bearer <token>). */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Please sign in to the admin panel.' });
  }
  try {
    req.admin = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = { signToken, requireAdmin, TOKEN_KEY };
