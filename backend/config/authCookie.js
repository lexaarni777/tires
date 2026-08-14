const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const DEFAULT_REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const DURATION_UNITS_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

const parseRefreshLifetimeMs = (expiresIn) => {
  if (typeof expiresIn !== 'string' || !expiresIn.trim()) {
    return DEFAULT_REFRESH_COOKIE_MAX_AGE_MS;
  }

  const match = expiresIn.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)?$/i);
  if (!match) {
    return DEFAULT_REFRESH_COOKIE_MAX_AGE_MS;
  }

  const amount = Number(match[1]);
  const unit = (match[2] || 'ms').toLowerCase();
  const maxAge = Math.floor(amount * DURATION_UNITS_MS[unit]);

  return Number.isSafeInteger(maxAge) && maxAge > 0
    ? maxAge
    : DEFAULT_REFRESH_COOKIE_MAX_AGE_MS;
};

const getRefreshCookieOptions = ({
  nodeEnv = process.env.NODE_ENV,
  expiresIn = process.env.JWT_REFRESH_EXPIRES_IN,
} = {}) => ({
  httpOnly: true,
  secure: nodeEnv === 'production',
  sameSite: 'lax',
  path: REFRESH_COOKIE_PATH,
  maxAge: parseRefreshLifetimeMs(expiresIn),
});

const getRefreshCookieClearOptions = ({
  nodeEnv = process.env.NODE_ENV,
} = {}) => {
  const { maxAge, ...options } = getRefreshCookieOptions({ nodeEnv });
  return options;
};

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  DEFAULT_REFRESH_COOKIE_MAX_AGE_MS,
  parseRefreshLifetimeMs,
  getRefreshCookieOptions,
  getRefreshCookieClearOptions,
};
