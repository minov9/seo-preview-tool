const crypto = require('crypto');

/**
 * Get the public component from the private key
 * Since we only have the private key (ALIPAY_PRIVATE_KEY) in env,
 * and we want to verify signatures internally too.
 * Note: If using Node >= 11.6.0, we can use createPublicKey.
 */
function getPublicKey() {
    const privateKey = process.env.ALIPAY_PRIVATE_KEY || '';
    if (!privateKey) return null;

    try {
        const keyObject = crypto.createPublicKey(privateKey);
        return keyObject.export({ type: 'spki', format: 'pem' });
    } catch (e) {
        console.error('Failed to derive public key:', e);
        return null;
    }
}

function normalizeKey(key, type) {
    if (!key) return null;
    if (key.includes('-----BEGIN')) return key;
    const header = type === 'private' ? 'RSA PRIVATE KEY' : 'PUBLIC KEY';
    return `-----BEGIN ${header}-----\n${key}\n-----END ${header}-----`;
}

/**
 * Sign a payload object
 * Format: base64(json).base64(signature)
 */
function signLicense(payload) {
    const privateKeyRaw = process.env.ALIPAY_PRIVATE_KEY;
    if (!privateKeyRaw) throw new Error('Missing ALIPAY_PRIVATE_KEY');

    const privateKey = normalizeKey(privateKeyRaw, 'private');
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');

    const sign = crypto.createSign('SHA256');
    sign.update(data);
    const signature = sign.sign(privateKey, 'base64');

    return `${data}.${signature}`;
}

/**
 * Verify a signed license key
 * Returns payload object if valid, null otherwise
 */
function verifyLicense(licenseKey) {
    if (!licenseKey || !licenseKey.includes('.')) return null;

    const [dataB64, signatureB64] = licenseKey.split('.');
    if (!dataB64 || !signatureB64) return null;

    const publicKeyPem = getPublicKey();
    if (!publicKeyPem) return null;

    try {
        const verify = crypto.createVerify('SHA256');
        verify.update(dataB64);
        const isValid = verify.verify(publicKeyPem, signatureB64, 'base64');

        if (isValid) {
            return JSON.parse(Buffer.from(dataB64, 'base64').toString());
        }
    } catch (e) {
        // Verification failed
    }
    return null;
}

module.exports = {
    signLicense,
    verifyLicense
};
