// middleware/isAdmin.js
import admin from '../config/admin.js';

const normEmail = (s = '') => String(s).trim().toLowerCase();

/**
 * isAdmin middleware
 * - Prefer JWT: if verifyTokenMiddleware ran earlier, req.user will exist.
 * - Accepts either req.user.role === 'admin' OR req.user.email === admin.email.
 * - Falls back to legacy body { email, password } check for compatibility.
 */
const isAdmin = (req, res, next) => {
  try {
    // 1) JWT path (preferred) — verifyTokenMiddleware must run before this
    if (req.user) {
      const userRole = (req.user.role || '').toString().trim().toLowerCase();
      const userEmail = normEmail(req.user.email);
      if (userRole === 'admin' || userEmail === normEmail(admin.email)) {
        return next();
      }
    }

    // 2) Legacy body-check fallback (keeps older admin-by-body usage working)
    const { email, password } = req.body || {};
    if (email && password) {
      if (normEmail(email) === normEmail(admin.email) && password === admin.password) {
        return next();
      }
    }

    // Otherwise deny
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  } catch (err) {
    console.error('isAdmin middleware error:', err);
    return res.status(500).json({ error: 'Server error in isAdmin' });
  }
};

export default isAdmin;
