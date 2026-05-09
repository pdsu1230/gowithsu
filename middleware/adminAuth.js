const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dang123';
const AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || 'dangu-admin-secret';
const COOKIE_NAME = 'dangu_admin';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex === -1) {
        return cookies;
      }

      const key = item.slice(0, separatorIndex);
      const value = item.slice(separatorIndex + 1);
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function buildSignature(username, expiresAt) {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${username}.${expiresAt}`)
    .digest('hex');
}

function createAuthToken(username = ADMIN_USERNAME) {
  const expiresAt = Date.now() + COOKIE_MAX_AGE;
  const signature = buildSignature(username, expiresAt);
  return Buffer.from(`${username}.${expiresAt}.${signature}`, 'utf8').toString('base64url');
}

function verifyAuthToken(token) {
  if (!token) {
    return false;
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [username, expiresAt, signature] = decoded.split('.');

    if (!username || !expiresAt || !signature) {
      return false;
    }

    if (username !== ADMIN_USERNAME) {
      return false;
    }

    if (Number(expiresAt) < Date.now()) {
      return false;
    }

    const expectedSignature = buildSignature(username, expiresAt);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (error) {
    return false;
  }
}

function isAdminAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifyAuthToken(cookies[COOKIE_NAME]);
}

function setAdminCookie(res) {
  const token = createAuthToken();
  const maxAgeSeconds = Math.floor(COOKIE_MAX_AGE / 1000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax`
  );
}

function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}

function requireAdminApi(req, res, next) {
  if (req.path === '/login' || req.path === '/logout' || req.path === '/session') {
    return next();
  }

  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập admin.' });
  }

  next();
}

function requireAdminPage(req, res, next) {
  if (!isAdminAuthenticated(req)) {
    return res.redirect('/?adminLogin=1');
  }

  next();
}

function loginAdmin(req, res) {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Sai thông tin đăng nhập admin.' });
  }

  setAdminCookie(res);
  return res.json({ message: 'Đăng nhập thành công.', redirectTo: '/admin/overview' });
}

function logoutAdmin(req, res) {
  clearAdminCookie(res);
  res.json({ message: 'Đã đăng xuất admin.' });
}

function getAdminSession(req, res) {
  res.json({ authenticated: isAdminAuthenticated(req) });
}

module.exports = {
  requireAdminApi,
  requireAdminPage,
  loginAdmin,
  logoutAdmin,
  getAdminSession,
  isAdminAuthenticated,
  ADMIN_USERNAME,
  ADMIN_PASSWORD
};