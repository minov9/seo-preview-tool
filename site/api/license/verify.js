const { verifyLicense } = require('../../util/crypto');

const DEFAULT_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function setCors(res) {
  const origin = process.env.LICENSE_CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeTimestamp(value) {
  if (!value) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function readLicenseStore() {
  const raw = process.env.LICENSE_KEYS || '{}';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    return {};
  }
  return {};
}

module.exports = (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ valid: false, message: 'Method not allowed' });
    return;
  }

  const body = parseBody(req);
  const licenseKey = String(body.licenseKey || body.license || '').trim();
  if (!licenseKey) {
    res.status(400).json({ valid: false, message: 'Missing license key' });
    return;
  }

  // Strategy 1: Static environment variable keys (Legacy)
  const store = readLicenseStore();
  let record = store[licenseKey];

  // Strategy 2: Signed keys (Stateless)
  if (!record) {
    const payload = verifyLicense(licenseKey);
    if (payload) {
      record = payload;
    }
  }

  if (!record) {
    res.status(200).json({ valid: false, message: 'Invalid license key' });
    return;
  }

  const expiresAt = normalizeTimestamp(record.expiresAt || record.expires_at);
  if (!expiresAt) {
    res.status(200).json({ valid: false, message: 'Missing expiresAt' });
    return;
  }

  if (expiresAt <= Date.now()) {
    res.status(200).json({ valid: false, expired: true, expiresAt });
    return;
  }

  res.status(200).json({
    valid: true,
    plan: record.plan || 'pro',
    expiresAt
  });
};
