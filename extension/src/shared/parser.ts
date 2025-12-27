import type { OgData, TwitterData, HeaderData } from './types';
import { getTitleWidth, getDescriptionWidth } from './metrics';

export function getMetaContent(name: string): string | null {
    const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return element ? element.getAttribute('content') : null;
}

function resolveUrl(value: string | null): string | undefined {
    if (!value) return undefined;
    try {
        return new URL(value, document.baseURI).href;
    } catch {
        return value;
    }
}

export function parseOg(): OgData {
    return {
        title: getMetaContent('og:title') || undefined,
        description: getMetaContent('og:description') || undefined,
        image: resolveUrl(getMetaContent('og:image')),
        siteName: getMetaContent('og:site_name') || undefined,
        // Width/Height might be updated later if image loading is supported, 
        // but for MVP DOM scan we check meta tags first.
        imageWidth: Number(getMetaContent('og:image:width')) || undefined,
        imageHeight: Number(getMetaContent('og:image:height')) || undefined,
    };
}

export function parseTwitter(): TwitterData {
    return {
        card: getMetaContent('twitter:card') || undefined,
        title: getMetaContent('twitter:title') || undefined,
        description: getMetaContent('twitter:description') || undefined,
        image: resolveUrl(getMetaContent('twitter:image')),
    };
}

export function parseH1(): HeaderData {
    const h1s = Array.from(document.querySelectorAll('h1'));
    return {
        count: h1s.length,
        text: h1s[0]?.textContent?.trim() || undefined
    };
}

export function getPageMetrics() {
    const rawTitle = document.title || '';
    const rawDesc = getMetaContent('description') || '';

    return {
        title: {
            value: rawTitle,
            pxWidth: getTitleWidth(rawTitle)
        },
        description: {
            value: rawDesc,
            pxWidth: getDescriptionWidth(rawDesc)
        }
    }
}
