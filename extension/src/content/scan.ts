import { parseOg, parseTwitter, parseH1, getPageMetrics, getMetaContent } from '../shared/parser';
import { evaluateRules } from '../shared/rules';
import type { ScanResult, ScanMessageResponse } from '../shared/types';

// Define Message types since we don't have a shared library for messaging yet
type ScanMessage = { type: 'SCAN_PAGE' };

function loadImageSize(url?: string): Promise<{ width: number; height: number } | null> {
    if (!url) return Promise.resolve(null);

    return new Promise((resolve) => {
        const image = new Image();
        const timeout = window.setTimeout(() => {
            cleanup();
            resolve(null);
        }, 3000);

        const cleanup = () => {
            window.clearTimeout(timeout);
            image.onload = null;
            image.onerror = null;
        };

        image.onload = () => {
            cleanup();
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
        };

        image.onerror = () => {
            cleanup();
            resolve(null);
        };

        image.decoding = 'async';
        image.src = url;
    });
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((message: ScanMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.type === 'SCAN_PAGE') {
        (async () => {
            try {
                const metrics = getPageMetrics();
                const og = parseOg();
                const twitter = parseTwitter();
                const h1 = parseH1();
                const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
                const robots = getMetaContent('robots');

                if (og.image && (!og.imageWidth || !og.imageHeight)) {
                    const ogImageSize = await loadImageSize(og.image);
                    if (ogImageSize) {
                        og.imageWidth = ogImageSize.width;
                        og.imageHeight = ogImageSize.height;
                    }
                }

                if (twitter.image && (!og.imageWidth || !og.imageHeight)) {
                    const twitterImageSize = await loadImageSize(twitter.image);
                    if (twitterImageSize && !og.image) {
                        og.imageWidth = twitterImageSize.width;
                        og.imageHeight = twitterImageSize.height;
                    }
                }

                const rawData = {
                    url: window.location.href,
                    title: metrics.title,
                    description: metrics.description,
                    canonical,
                    robots,
                    h1,
                    og,
                    twitter,
                    metaGeneratedAt: Date.now()
                };

                const issues = evaluateRules(rawData);

                const result: ScanResult = {
                    ...rawData,
                    issues
                };

                const response: ScanMessageResponse = {
                    success: true,
                    data: result
                };

                sendResponse(response);
            } catch (error) {
                console.error('[SEO Preview] Scan failed:', error);
                const errorResponse: ScanMessageResponse = {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
                sendResponse(errorResponse);
            }
        })();
    }
    // Must return true to indicate async response
    return true;
});
