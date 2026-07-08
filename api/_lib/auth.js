/**
 * Cookie session for the /admin back office, keyed off
 * BACKOFFICE_ADMIN_PASSWORD (Vercel env). Token = expiry.HMAC(expiry).
 */

const crypto = require('crypto');

const secret = () => process.env.BACKOFFICE_ADMIN_PASSWORD || '';
const sign = (exp) => crypto.createHmac('sha256', 'bo:' + secret()).update(String(exp)).digest('hex');

const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

function issueCookie() {
  const exp = Date.now() + THIRTY_DAYS_S * 1000;
  return `bo_session=${exp}.${sign(exp)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS_S}`;
}

const clearCookie = () => 'bo_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

function verify(req) {
  if (!secret()) return false;
  const m = /(?:^|;\s*)bo_session=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return false;
  const [expStr, sig] = m[1].split('.');
  const exp = Number(expStr);
  if (!exp || exp < Date.now() || !sig) return false;
  const want = sign(exp);
  return (
    sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))
  );
}

function checkPassword(pw) {
  const s = secret();
  if (!s || typeof pw !== 'string') return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(s);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { verify, issueCookie, clearCookie, checkPassword };
