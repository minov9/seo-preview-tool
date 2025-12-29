const RESTRICTED_PROTOCOLS = ['chrome:', 'edge:', 'about:', 'chrome-extension:'];

function isChromeWebStore(url: URL): boolean {
    if (url.hostname === 'chromewebstore.google.com') return true;
    if (url.hostname === 'chrome.google.com' && url.pathname.startsWith('/webstore')) return true;
    return false;
}

function isEdgeAddons(url: URL): boolean {
    return url.hostname === 'microsoftedge.microsoft.com' && url.pathname.startsWith('/addons');
}

export function isRestrictedUrl(rawUrl?: string | null): boolean {
    if (!rawUrl) return true;
    try {
        const url = new URL(rawUrl);
        if (RESTRICTED_PROTOCOLS.includes(url.protocol)) return true;
        if (isChromeWebStore(url)) return true;
        if (isEdgeAddons(url)) return true;
        return false;
    } catch {
        return true;
    }
}
