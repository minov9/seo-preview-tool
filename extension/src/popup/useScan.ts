import { useState, useEffect, useCallback } from 'react';
import type { ScanResult, ScanMessageResponse } from '../shared/types';
import { t } from '../shared/i18n';

export function useScan() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ScanResult | null>(null);

    const scan = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab?.id) {
                throw new Error(t('popupErrorNoTab'));
            }

            // Skip chrome://, edge://, etc.
            if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
                throw new Error(t('popupErrorInternal'));
            }

            // We need to ensure content script is injected? 
            // MV3 content scripts are declared in manifest, so they should be there if pattern matches.
            // But for robustness, we might want to check injection. For MVP, assume manifest is correct.

            try {
                const response: ScanMessageResponse = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
                if (response.success && response.data) {
                    setData(response.data);
                    // Save to storage for Preview page
                    await chrome.storage.local.set({ 'lastScan': response.data });
                    return;
                }
                setError(response.error || t('popupErrorConnectionFailed'));
            } catch (e) {
                // Often happens if content script isn't loaded (e.g. refreshed extension but not page)
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['assets/scan.js']
                    });
                    const retry: ScanMessageResponse = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
                    if (retry.success && retry.data) {
                        setData(retry.data);
                        await chrome.storage.local.set({ 'lastScan': retry.data });
                        return;
                    }
                    setError(retry.error || t('popupErrorConnectionFailed'));
                } catch (injectError) {
                    setError(t('popupErrorConnectionFailed'));
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        scan();
    }, [scan]);

    return { data, loading, error, reScan: scan };
}
