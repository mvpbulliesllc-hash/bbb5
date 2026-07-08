/**
 * Back-office session endpoint.
 *   GET    → { ok: boolean }   is the session cookie valid?
 *   POST   { password } → sets the session cookie
 *   DELETE → clears the session cookie (sign out)
 */

const { verify, issueCookie, clearCookie, checkPassword } = require('../_lib/auth.js');

module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).json({ ok: verify(req) });
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!process.env.BACKOFFICE_ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'admin password not configured' });
  }
  const pw = (req.body && req.body.password) || '';
  if (!checkPassword(pw)) {
    await new Promise((r) => setTimeout(r, 400)); // slow brute force a touch
    return res.status(401).json({ error: 'Wrong password' });
  }
  res.setHeader('Set-Cookie', issueCookie());
  return res.status(200).json({ ok: true });
};
