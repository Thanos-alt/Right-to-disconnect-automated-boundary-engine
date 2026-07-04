// Simple token authentication for the RTD-ABE demo server
const crypto = require('crypto');

const TOKENS = new Map();

// Pre-seeded demo tokens
TOKENS.set('demo-manager-token', { role: 'manager', name: 'MGR-ALPHA' });
TOKENS.set('demo-admin-token', { role: 'admin', name: 'Admin User' });
TOKENS.set('demo-hr-token', { role: 'hr', name: 'HR User' });
TOKENS.set('demo-employee-token', { role: 'employee', name: 'EMP-001' });

function authenticate(headers) {
  const token = (headers['x-rtd-token'] || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return null;
  }

  const principal = TOKENS.get(token);
  if (!principal) {
    return null;
  }

  return principal;
}

/** Express middleware */
function authMiddleware(req, res, next) {
  const principal = authenticate(req.headers);
  if (!principal) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Valid x-rtd-token header required' });
  }
  req.principal = principal;
  next();
}

module.exports = { authenticate, authMiddleware, TOKENS };
