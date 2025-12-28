import { LICENSE_API_BASE, UPGRADE_URL } from './config';

const STORAGE_KEY = 'proStatus';

type ProSource = 'remote' | 'local';

export interface ProStatus {
    licenseKey: string | null;
    expiresAt: number | null;
    updatedAt: number | null;
    plan?: string;
    source?: ProSource;
}

export type LicenseErrorCode =
    | 'missing'
    | 'not_configured'
    | 'invalid'
    | 'expired'
    | 'network'
    | 'unknown';

export interface LicenseError {
    code: LicenseErrorCode;
    message?: string;
}

export interface LicenseVerifyResult {
    status?: ProStatus;
    error?: LicenseError;
}

function normalizeTimestamp(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

function normalizeProStatus(value: unknown): ProStatus {
    if (!value || typeof value !== 'object') {
        return { licenseKey: null, expiresAt: null, updatedAt: null };
    }

    const record = value as Partial<ProStatus>;
    return {
        licenseKey: record.licenseKey || null,
        expiresAt: normalizeTimestamp(record.expiresAt),
        updatedAt: normalizeTimestamp(record.updatedAt),
        plan: record.plan,
        source: record.source
    };
}

export async function loadProStatus(): Promise<ProStatus> {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        return normalizeProStatus(result[STORAGE_KEY]);
    } catch {
        return normalizeProStatus(null);
    }
}

export async function saveProStatus(status: ProStatus): Promise<void> {
    try {
        await chrome.storage.local.set({ [STORAGE_KEY]: status });
    } catch {
        // Ignore storage errors
    }
}

export async function clearProStatus(): Promise<void> {
    try {
        await chrome.storage.local.remove(STORAGE_KEY);
    } catch {
        // Ignore storage errors
    }
}

export function isProActive(status?: ProStatus | null): boolean {
    if (!status?.expiresAt) return false;
    return status.expiresAt > Date.now();
}

export function resolveUpgradeUrl(): string | null {
    if (UPGRADE_URL) return UPGRADE_URL;
    try {
        return chrome.runtime.getManifest().homepage_url || null;
    } catch {
        return null;
    }
}

function resolveLicenseEndpoint(): string | null {
    if (!LICENSE_API_BASE) return null;
    try {
        return new URL('/api/license/verify', LICENSE_API_BASE).toString();
    } catch {
        return null;
    }
}

export async function verifyLicense(licenseKey: string): Promise<LicenseVerifyResult> {
    const trimmedKey = licenseKey.trim();
    if (!trimmedKey) {
        return { error: { code: 'missing' } };
    }

    const endpoint = resolveLicenseEndpoint();
    if (!endpoint) {
        return { error: { code: 'not_configured' } };
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey: trimmedKey })
        });

        if (!response.ok) {
            return { error: { code: 'network', message: `HTTP ${response.status}` } };
        }

        const payload = await response.json();
        if (!payload || typeof payload !== 'object') {
            return { error: { code: 'unknown' } };
        }

        if (!payload.valid) {
            const errorCode = payload.expired ? 'expired' : 'invalid';
            return { error: { code: errorCode, message: payload.message } };
        }

        const expiresAt = normalizeTimestamp(payload.expiresAt);
        if (!expiresAt) {
            return { error: { code: 'unknown', message: 'Missing expiresAt' } };
        }

        const status: ProStatus = {
            licenseKey: trimmedKey,
            expiresAt,
            updatedAt: Date.now(),
            plan: payload.plan || 'pro',
            source: 'remote'
        };

        await saveProStatus(status);
        return { status };
    } catch (error) {
        return { error: { code: 'network', message: error instanceof Error ? error.message : undefined } };
    }
}

export function maskLicenseKey(licenseKey?: string | null): string {
    if (!licenseKey) return '';
    const cleaned = licenseKey.trim();
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}***${cleaned.slice(-1)}`;
    return `${cleaned.slice(0, 4)}****${cleaned.slice(-4)}`;
}

export function formatExpiry(expiresAt?: number | null): string {
    if (!expiresAt) return '';
    return new Date(expiresAt).toLocaleDateString();
}
