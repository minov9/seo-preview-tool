import { useCallback, useEffect, useState } from 'react';
import type { LicenseError, ProStatus } from './pro';
import { clearProStatus, isProActive, loadProStatus, verifyLicense } from './pro';

export function useProStatus() {
    const [status, setStatus] = useState<ProStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<LicenseError | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        const next = await loadProStatus();
        setStatus(next);
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
            if (area === 'local' && changes.proStatus) {
                void loadProStatus().then(setStatus);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, [refresh]);

    const activate = useCallback(async (licenseKey: string) => {
        setError(null);
        const result = await verifyLicense(licenseKey);
        if (result.error) {
            setError(result.error);
            return false;
        }
        if (result.status) {
            setStatus(result.status);
        }
        return true;
    }, []);

    const clear = useCallback(async () => {
        await clearProStatus();
        setStatus({ licenseKey: null, expiresAt: null, updatedAt: null });
    }, []);

    return {
        status,
        loading,
        error,
        isActive: isProActive(status),
        refresh,
        activate,
        clear,
        setError
    };
}
